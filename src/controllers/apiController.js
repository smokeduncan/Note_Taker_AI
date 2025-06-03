const { createStream, handleSSE, AGUIEventType } = require('../ag-ui/AGUIStream');
const MCPServerManager = require('../mcp/MCPServerManager');
const SAPSalesCloudMCPServer = require('../mcp/SAPSalesCloudMCPServer');
const NoteProcessorAgent = require('./NoteProcessorAgent');
const mongoose = require('mongoose');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-controller' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api-controller-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'api-controller.log' })
  ]
});

// Initialize MCP Server Manager
const mcpManager = new MCPServerManager({
  healthCheckInterval: 60000, // 1 minute
  enableHealthCheck: true,
  enableFallback: true
});

// Initialize SAP Sales Cloud MCP Server
const initializeMCPServers = () => {
  try {
    // Get configuration from environment variables
    const sapTenantUrl = process.env.SAP_TENANT_URL;
    const sapUsername = process.env.SAP_API_USERNAME;
    const sapPassword = process.env.SAP_API_PASSWORD;
    
    if (!sapTenantUrl || !sapUsername || !sapPassword) {
      logger.warn('SAP Sales Cloud credentials not found in environment variables');
      return false;
    }
    
    // Create and register SAP Sales Cloud MCP Server
    const sapServer = new SAPSalesCloudMCPServer(
      sapTenantUrl,
      sapUsername,
      sapPassword,
      { timeout: 30000 }
    );
    
    mcpManager.registerServer('sap_sales_cloud', sapServer, {
      priority: 1,
      enabled: true,
      fallbackServers: []
    });
    
    logger.info('SAP Sales Cloud MCP Server registered successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize MCP servers', { error: error.message });
    return false;
  }
};

// Initialize NoteProcessorAgent
const noteProcessor = new NoteProcessorAgent(mcpManager, {
  defaultModel: 'gemini-pro',
  maxRetries: 3
});

// Active AG-UI streams
const activeStreams = new Map();

/**
 * Clean up inactive streams
 */
const cleanupInactiveStreams = () => {
  const now = Date.now();
  
  for (const [threadId, streamInfo] of activeStreams.entries()) {
    // Remove streams inactive for more than 30 minutes
    if (now - streamInfo.lastActivity > 30 * 60 * 1000) {
      streamInfo.stream.dispose();
      activeStreams.delete(threadId);
      logger.info(`Cleaned up inactive stream: ${threadId}`);
    }
  }
};

// Set up periodic cleanup
setInterval(cleanupInactiveStreams, 15 * 60 * 1000); // Every 15 minutes

/**
 * Get or create AG-UI stream
 * @param {string} threadId - Thread ID
 * @param {Object} options - Stream options
 * @returns {Object} AG-UI stream
 */
const getOrCreateStream = (threadId, options = {}) => {
  if (activeStreams.has(threadId)) {
    const streamInfo = activeStreams.get(threadId);
    streamInfo.lastActivity = Date.now();
    return streamInfo.stream;
  }
  
  const stream = createStream({
    threadId,
    ...options
  });
  
  activeStreams.set(threadId, {
    stream,
    lastActivity: Date.now()
  });
  
  logger.info(`Created new AG-UI stream: ${threadId}`);
  return stream;
};

/**
 * Update stream activity timestamp
 * @param {string} threadId - Thread ID
 */
const updateStreamActivity = (threadId) => {
  if (activeStreams.has(threadId)) {
    activeStreams.get(threadId).lastActivity = Date.now();
  }
};

/**
 * Handle SSE connection for AG-UI stream
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const handleStreamConnection = (req, res) => {
  try {
    const threadId = req.params.threadId;
    
    if (!threadId) {
      res.status(400).json({ error: 'Thread ID is required' });
      return;
    }
    
    // Get or create stream
    const stream = getOrCreateStream(threadId);
    
    // Set up SSE connection
    handleSSE(stream, req, res);
    
    logger.info(`SSE connection established for thread: ${threadId}`);
  } catch (error) {
    logger.error('Error establishing SSE connection', { 
      error: error.message,
      threadId: req.params.threadId
    });
    
    res.status(500).json({ error: 'Failed to establish stream connection' });
  }
};

/**
 * Process a note with AG-UI streaming
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const processNote = async (req, res) => {
  try {
    const { noteId, threadId } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }
    
    // Generate thread ID if not provided
    const streamThreadId = threadId || `note_processing_${noteId}_${Date.now()}`;
    
    // Create response with stream ID
    res.status(200).json({
      threadId: streamThreadId,
      status: 'processing',
      streamUrl: `/api/stream/${streamThreadId}`
    });
    
    // Get or create stream
    const stream = getOrCreateStream(streamThreadId, {
      initialState: {
        noteId,
        status: 'starting',
        progress: 0
      }
    });
    
    // Get note from database
    const Note = mongoose.model('Note');
    const note = await Note.findById(noteId);
    
    if (!note) {
      await stream.sendError(`Note with ID ${noteId} not found`);
      return;
    }
    
    // Process note
    try {
      const result = await noteProcessor.processNote(note, stream);
      
      // Update note in database
      note.formattedContent = result.formattedContent;
      note.summary = result.summary;
      note.actionItems = result.actionItems;
      note.aiProcessed = true;
      note.aiProcessingDetails = {
        processedAt: new Date(),
        model: result.processingDetails.model,
        confidence: result.processingDetails.confidence.summary
      };
      
      await note.save();
      
      logger.info(`Note processed successfully: ${noteId}`);
    } catch (error) {
      logger.error('Error processing note', { 
        noteId, 
        error: error.message 
      });
      
      await stream.sendError(error);
    }
  } catch (error) {
    logger.error('Error in processNote controller', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: 'Failed to process note' });
  }
};

/**
 * Generate email draft from note
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const generateEmailDraft = async (req, res) => {
  try {
    const { noteId, threadId, options } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }
    
    // Generate thread ID if not provided
    const streamThreadId = threadId || `email_draft_${noteId}_${Date.now()}`;
    
    // Create response with stream ID
    res.status(200).json({
      threadId: streamThreadId,
      status: 'processing',
      streamUrl: `/api/stream/${streamThreadId}`
    });
    
    // Get or create stream
    const stream = getOrCreateStream(streamThreadId, {
      initialState: {
        noteId,
        status: 'starting',
        progress: 0
      }
    });
    
    // Get note from database
    const Note = mongoose.model('Note');
    const note = await Note.findById(noteId);
    
    if (!note) {
      await stream.sendError(`Note with ID ${noteId} not found`);
      return;
    }
    
    // Generate email draft
    try {
      await noteProcessor.generateEmailDraft(note, stream, options || {});
      logger.info(`Email draft generated for note: ${noteId}`);
    } catch (error) {
      logger.error('Error generating email draft', { 
        noteId, 
        error: error.message 
      });
      
      await stream.sendError(error);
    }
  } catch (error) {
    logger.error('Error in generateEmailDraft controller', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: 'Failed to generate email draft' });
  }
};

/**
 * Schedule meeting from note
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const scheduleMeeting = async (req, res) => {
  try {
    const { noteId, threadId, options } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }
    
    // Generate thread ID if not provided
    const streamThreadId = threadId || `meeting_${noteId}_${Date.now()}`;
    
    // Create response with stream ID
    res.status(200).json({
      threadId: streamThreadId,
      status: 'processing',
      streamUrl: `/api/stream/${streamThreadId}`
    });
    
    // Get or create stream
    const stream = getOrCreateStream(streamThreadId, {
      initialState: {
        noteId,
        status: 'starting',
        progress: 0
      }
    });
    
    // Get note from database
    const Note = mongoose.model('Note');
    const note = await Note.findById(noteId);
    
    if (!note) {
      await stream.sendError(`Note with ID ${noteId} not found`);
      return;
    }
    
    // Schedule meeting
    try {
      await noteProcessor.scheduleMeeting(note, stream, options || {});
      logger.info(`Meeting scheduled for note: ${noteId}`);
    } catch (error) {
      logger.error('Error scheduling meeting', { 
        noteId, 
        error: error.message 
      });
      
      await stream.sendError(error);
    }
  } catch (error) {
    logger.error('Error in scheduleMeeting controller', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
};

/**
 * Chat with AI about note
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const chatWithAI = async (req, res) => {
  try {
    const { noteId, message, threadId } = req.body;
    
    if (!noteId || !message) {
      return res.status(400).json({ error: 'Note ID and message are required' });
    }
    
    // Generate thread ID if not provided
    const streamThreadId = threadId || `chat_${noteId}_${Date.now()}`;
    
    // Create response with stream ID
    res.status(200).json({
      threadId: streamThreadId,
      status: 'processing',
      streamUrl: `/api/stream/${streamThreadId}`
    });
    
    // Get or create stream
    const stream = getOrCreateStream(streamThreadId, {
      initialState: {
        noteId,
        status: 'starting',
        progress: 0,
        message
      }
    });
    
    // Get note from database
    const Note = mongoose.model('Note');
    const note = await Note.findById(noteId);
    
    if (!note) {
      await stream.sendError(`Note with ID ${noteId} not found`);
      return;
    }
    
    // Chat with AI
    try {
      await noteProcessor.chatWithAI(note, message, stream);
      logger.info(`Chat completed for note: ${noteId}`);
    } catch (error) {
      logger.error('Error in AI chat', { 
        noteId, 
        message,
        error: error.message 
      });
      
      await stream.sendError(error);
    }
  } catch (error) {
    logger.error('Error in chatWithAI controller', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: 'Failed to chat with AI' });
  }
};

/**
 * Sync note with SAP Sales Cloud
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const syncWithSAP = async (req, res) => {
  try {
    const { noteId, threadId } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ error: 'Note ID is required' });
    }
    
    // Generate thread ID if not provided
    const streamThreadId = threadId || `sap_sync_${noteId}_${Date.now()}`;
    
    // Create response with stream ID
    res.status(200).json({
      threadId: streamThreadId,
      status: 'processing',
      streamUrl: `/api/stream/${streamThreadId}`
    });
    
    // Get or create stream
    const stream = getOrCreateStream(streamThreadId, {
      initialState: {
        noteId,
        status: 'starting',
        progress: 0
      }
    });
    
    // Get note from database
    const Note = mongoose.model('Note');
    const note = await Note.findById(noteId);
    
    if (!note) {
      await stream.sendError(`Note with ID ${noteId} not found`);
      return;
    }
    
    // Process note to extract entities and action items
    try {
      await stream.startLifecycle('Syncing with SAP Sales Cloud', { noteId: note.id });
      await stream.sendText('Analyzing note content...', { final: false });
      
      // Extract entities
      const extractedInfo = await noteProcessor._extractEntities(
        note.originalContent, 
        note.accountId, 
        stream
      );
      
      // Extract action items
      const actionItems = await noteProcessor._extractActionItems(
        note.originalContent, 
        extractedInfo, 
        stream
      );
      
      // Sync with SAP
      const syncResult = await noteProcessor._syncWithSAPSalesCloud(
        note, 
        extractedInfo, 
        actionItems, 
        stream
      );
      
      // Complete lifecycle
      await stream.complete(syncResult);
      
      logger.info(`Note synced with SAP: ${noteId}`);
    } catch (error) {
      logger.error('Error syncing with SAP', { 
        noteId, 
        error: error.message 
      });
      
      await stream.sendError(error);
    }
  } catch (error) {
    logger.error('Error in syncWithSAP controller', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: 'Failed to sync with SAP' });
  }
};

/**
 * Send user input to stream
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const sendUserInput = async (req, res) => {
  try {
    const { threadId, input } = req.body;
    
    if (!threadId || !input) {
      return res.status(400).json({ error: 'Thread ID and input are required' });
    }
    
    // Get stream
    if (!activeStreams.has(threadId)) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    const stream = activeStreams.get(threadId).stream;
    
    // Send user input
    const result = stream.sendUserInput(input);
    
    // Update activity timestamp
    updateStreamActivity(threadId);
    
    res.status(200).json({
      success: result,
      threadId
    });
    
    logger.info(`User input sent to stream: ${threadId}`);
  } catch (error) {
    logger.error('Error sending user input', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: 'Failed to send user input' });
  }
};

/**
 * Cancel stream
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const cancelStream = async (req, res) => {
  try {
    const { threadId, reason } = req.body;
    
    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' });
    }
    
    // Get stream
    if (!activeStreams.has(threadId)) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    const stream = activeStreams.get(threadId).stream;
    
    // Cancel stream
    await stream.cancel(reason || 'Cancelled by user');
    
    res.status(200).json({
      success: true,
      threadId,
      status: 'cancelled'
    });
    
    logger.info(`Stream cancelled: ${threadId}`);
  } catch (error) {
    logger.error('Error cancelling stream', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: 'Failed to cancel stream' });
  }
};

/**
 * Get stream status
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const getStreamStatus = async (req, res) => {
  try {
    const threadId = req.params.threadId;
    
    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' });
    }
    
    // Get stream
    if (!activeStreams.has(threadId)) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    const stream = activeStreams.get(threadId).stream;
    
    // Get state
    const state = stream.getState();
    
    // Update activity timestamp
    updateStreamActivity(threadId);
    
    res.status(200).json({
      threadId,
      state,
      isActive: true,
      lastActivity: activeStreams.get(threadId).lastActivity
    });
  } catch (error) {
    logger.error('Error getting stream status', { 
      error: error.message,
      threadId: req.params.threadId
    });
    
    res.status(500).json({ error: 'Failed to get stream status' });
  }
};

/**
 * List MCP servers
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const listMCPServers = async (req, res) => {
  try {
    const serverNames = mcpManager.getServerNames();
    const servers = {};
    
    for (const name of serverNames) {
      const config = mcpManager.getServerConfig(name);
      const health = mcpManager.getServerHealth(name);
      
      servers[name] = {
        config,
        health,
        isAvailable: health ? health.isAvailable : false
      };
    }
    
    res.status(200).json({
      servers,
      count: serverNames.length
    });
  } catch (error) {
    logger.error('Error listing MCP servers', { error: error.message });
    res.status(500).json({ error: 'Failed to list MCP servers' });
  }
};

/**
 * List MCP tools for a specific server
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const listMCPTools = async (req, res) => {
  try {
    const serverName = req.params.serverName;
    
    if (!serverName) {
      return res.status(400).json({ error: 'Server name is required' });
    }
    
    const server = mcpManager.getServer(serverName);
    
    if (!server) {
      return res.status(404).json({ error: `Server '${serverName}' not found` });
    }
    
    const tools = await server.listTools();
    
    res.status(200).json({
      serverName,
      tools,
      count: tools.length
    });
  } catch (error) {
    logger.error('Error listing MCP tools', { 
      error: error.message,
      serverName: req.params.serverName
    });
    
    res.status(500).json({ error: 'Failed to list MCP tools' });
  }
};

/**
 * Execute MCP tool directly (for testing)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const executeMCPTool = async (req, res) => {
  try {
    const { serverName, toolName, params } = req.body;
    
    if (!serverName || !toolName) {
      return res.status(400).json({ error: 'Server name and tool name are required' });
    }
    
    const result = await mcpManager.executeTool(
      serverName,
      toolName,
      params || {}
    );
    
    res.status(200).json({
      serverName,
      toolName,
      result
    });
    
    logger.info(`MCP tool executed: ${serverName}.${toolName}`);
  } catch (error) {
    logger.error('Error executing MCP tool', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ error: `Failed to execute MCP tool: ${error.message}` });
  }
};

/**
 * Initialize controller
 */
const initialize = () => {
  // Initialize MCP servers
  const mcpInitialized = initializeMCPServers();
  
  logger.info(`API Controller initialized. MCP servers initialized: ${mcpInitialized}`);
  
  return {
    mcpInitialized
  };
};

module.exports = {
  initialize,
  handleStreamConnection,
  processNote,
  generateEmailDraft,
  scheduleMeeting,
  chatWithAI,
  syncWithSAP,
  sendUserInput,
  cancelStream,
  getStreamStatus,
  listMCPServers,
  listMCPTools,
  executeMCPTool
};
