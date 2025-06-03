const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ag-ui-stream' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'ag-ui-stream-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'ag-ui-stream.log' })
  ]
});

/**
 * AG-UI Event Types
 * Standard event types for agent-user interactions
 */
const AGUIEventType = {
  TEXT_MESSAGE_CONTENT: 'TEXT_MESSAGE_CONTENT',   // Streaming text
  TOOL_CALL_START: 'TOOL_CALL_START',             // MCP tool execution begins
  TOOL_CALL_END: 'TOOL_CALL_END',                 // MCP tool execution complete
  STATE_DELTA: 'STATE_DELTA',                     // Incremental state updates
  ERROR: 'ERROR',                                 // Error handling
  LIFECYCLE_START: 'LIFECYCLE_START',             // Agent workflow begins
  LIFECYCLE_END: 'LIFECYCLE_END',                 // Agent workflow complete
  USER_INPUT_REQUEST: 'USER_INPUT_REQUEST',       // Human-in-the-loop input
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',             // Progress indicators
  CONTEXT_UPDATE: 'CONTEXT_UPDATE',               // Context changes
  CANCELLATION: 'CANCELLATION',                   // User cancellation
  AUTHENTICATION: 'AUTHENTICATION',               // Auth events
  RESOURCE_UPDATE: 'RESOURCE_UPDATE',             // Resource state changes
  MEDIA_CONTENT: 'MEDIA_CONTENT',                 // Media streaming
  CUSTOM_EVENT: 'CUSTOM_EVENT',                   // App-specific events
  BATCH_EVENTS: 'BATCH_EVENTS'                    // Grouped events
};

/**
 * AG-UI Stream
 * Manages real-time event streaming between agents and users
 */
class AGUIStream extends EventEmitter {
  /**
   * Initialize a new AG-UI Stream
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.threadId = options.threadId || uuidv4();
    this.runId = options.runId || uuidv4();
    this.userId = options.userId;
    this.agentId = options.agentId;
    
    this.events = [];
    this.state = {
      status: 'idle',
      currentStep: null,
      progress: 0,
      tools: [],
      context: {},
      ...options.initialState
    };
    
    this.clients = new Set();
    this.pendingInputPromises = [];
    this.isCancelled = false;
    this.isCompleted = false;
    
    this.options = {
      bufferEvents: options.bufferEvents !== false,
      maxBufferSize: options.maxBufferSize || 1000,
      enableStateTracking: options.enableStateTracking !== false,
      ...options
    };
    
    logger.info('AG-UI Stream initialized', { 
      threadId: this.threadId, 
      runId: this.runId,
      options: this.options
    });
  }

  /**
   * Emit an AG-UI event
   * @async
   * @param {Object} event - Event data
   * @returns {Promise<Object>} Emitted event
   */
  async emit(event) {
    if (this.isCancelled && event.type !== AGUIEventType.CANCELLATION) {
      logger.warn('Stream is cancelled, ignoring event', { type: event.type });
      return null;
    }
    
    if (this.isCompleted && event.type !== AGUIEventType.LIFECYCLE_END) {
      logger.warn('Stream is completed, ignoring event', { type: event.type });
      return null;
    }
    
    // Create full event object
    const fullEvent = {
      id: event.id || uuidv4(),
      type: event.type,
      data: event.data || {},
      threadId: this.threadId,
      runId: this.runId,
      timestamp: event.timestamp || new Date().toISOString(),
      source: event.source || 'agent'
    };
    
    // Process specific event types
    await this._processEvent(fullEvent);
    
    // Buffer event if enabled
    if (this.options.bufferEvents) {
      this._bufferEvent(fullEvent);
    }
    
    // Emit to all connected clients
    this._broadcastToClients(fullEvent);
    
    // Emit to event listeners
    super.emit('event', fullEvent);
    super.emit(fullEvent.type, fullEvent);
    
    logger.debug('Event emitted', { 
      type: fullEvent.type, 
      id: fullEvent.id,
      threadId: this.threadId
    });
    
    return fullEvent;
  }

  /**
   * Process specific event types
   * @private
   * @async
   * @param {Object} event - Event to process
   */
  async _processEvent(event) {
    // Update state based on event type
    if (this.options.enableStateTracking) {
      switch (event.type) {
        case AGUIEventType.LIFECYCLE_START:
          this.state.status = 'running';
          this.state.currentStep = event.data.task || 'Starting workflow';
          this.state.progress = 0;
          break;
          
        case AGUIEventType.LIFECYCLE_END:
          this.state.status = 'complete';
          this.state.progress = 100;
          this.isCompleted = true;
          break;
          
        case AGUIEventType.TOOL_CALL_START:
          this.state.status = 'tool_execution';
          this.state.currentStep = `Executing ${event.data.tool || 'tool'}`;
          this.state.tools.push({
            id: event.id,
            name: event.data.tool,
            server: event.data.server,
            status: 'running',
            startTime: new Date().toISOString()
          });
          break;
          
        case AGUIEventType.TOOL_CALL_END:
          const toolIndex = this.state.tools.findIndex(t => t.id === event.data.toolCallId);
          if (toolIndex >= 0) {
            this.state.tools[toolIndex].status = 'complete';
            this.state.tools[toolIndex].result = event.data.result;
            this.state.tools[toolIndex].endTime = new Date().toISOString();
          }
          this.state.status = 'thinking';
          break;
          
        case AGUIEventType.USER_INPUT_REQUEST:
          this.state.status = 'waiting_input';
          this.state.currentStep = event.data.question || 'Waiting for user input';
          // Resolve any pending input promises when request is made
          this._notifyInputRequest(event);
          break;
          
        case AGUIEventType.PROGRESS_UPDATE:
          if (typeof event.data.progress === 'number') {
            this.state.progress = event.data.progress;
          }
          if (event.data.step) {
            this.state.currentStep = event.data.step;
          }
          break;
          
        case AGUIEventType.STATE_DELTA:
          // Merge state delta with current state
          this.state = {
            ...this.state,
            ...event.data
          };
          break;
          
        case AGUIEventType.ERROR:
          this.state.status = 'error';
          this.state.error = event.data.error || 'Unknown error';
          break;
          
        case AGUIEventType.CANCELLATION:
          this.state.status = 'cancelled';
          this.isCancelled = true;
          // Reject any pending input promises
          this._rejectPendingInputs(new Error('Stream cancelled'));
          break;
      }
      
      // Emit state update event
      super.emit('state:update', this.state);
    }
  }

  /**
   * Buffer an event in the events array
   * @private
   * @param {Object} event - Event to buffer
   */
  _bufferEvent(event) {
    this.events.push(event);
    
    // Trim buffer if it exceeds max size
    if (this.events.length > this.options.maxBufferSize) {
      this.events = this.events.slice(-this.options.maxBufferSize);
      logger.debug(`Event buffer trimmed to ${this.options.maxBufferSize} events`);
    }
  }

  /**
   * Broadcast event to all connected clients
   * @private
   * @param {Object} event - Event to broadcast
   */
  _broadcastToClients(event) {
    for (const client of this.clients) {
      try {
        client.send(JSON.stringify(event));
      } catch (error) {
        logger.error('Failed to send event to client', { 
          error: error.message,
          clientId: client.id 
        });
      }
    }
  }

  /**
   * Add a client to the stream
   * @param {Object} client - Client object with send method
   * @returns {Function} Function to remove the client
   */
  addClient(client) {
    if (!client || typeof client.send !== 'function') {
      throw new Error('Client must have a send method');
    }
    
    // Assign ID if not present
    if (!client.id) {
      client.id = uuidv4();
    }
    
    this.clients.add(client);
    
    logger.info('Client added to stream', { 
      clientId: client.id,
      threadId: this.threadId,
      clientCount: this.clients.size
    });
    
    // Send initial state and buffered events if available
    if (this.options.sendInitialState !== false) {
      try {
        // Send current state
        client.send(JSON.stringify({
          id: uuidv4(),
          type: AGUIEventType.STATE_DELTA,
          data: this.state,
          threadId: this.threadId,
          runId: this.runId,
          timestamp: new Date().toISOString(),
          source: 'system'
        }));
        
        // Send buffered events if enabled
        if (this.options.bufferEvents && this.options.sendBufferedEvents !== false) {
          for (const event of this.events) {
            client.send(JSON.stringify(event));
          }
        }
      } catch (error) {
        logger.error('Failed to send initial state to client', { 
          error: error.message,
          clientId: client.id 
        });
      }
    }
    
    // Return function to remove client
    return () => {
      this.removeClient(client);
    };
  }

  /**
   * Remove a client from the stream
   * @param {Object} client - Client to remove
   * @returns {boolean} Success status
   */
  removeClient(client) {
    const removed = this.clients.delete(client);
    
    if (removed) {
      logger.info('Client removed from stream', { 
        clientId: client.id,
        threadId: this.threadId,
        clientCount: this.clients.size
      });
    }
    
    return removed;
  }

  /**
   * Wait for user input
   * @async
   * @param {Object} options - Wait options
   * @returns {Promise<Object>} User input
   */
  async waitForInput(options = {}) {
    if (this.isCancelled) {
      throw new Error('Stream is cancelled');
    }
    
    logger.debug('Waiting for user input', { 
      threadId: this.threadId,
      timeout: options.timeout
    });
    
    // Create promise for user input
    const inputPromise = new Promise((resolve, reject) => {
      const promiseObj = { resolve, reject, options };
      this.pendingInputPromises.push(promiseObj);
      
      // Set timeout if specified
      if (options.timeout) {
        setTimeout(() => {
          // Remove from pending promises
          const index = this.pendingInputPromises.indexOf(promiseObj);
          if (index >= 0) {
            this.pendingInputPromises.splice(index, 1);
          }
          
          reject(new Error(`Timeout waiting for user input after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
    
    return inputPromise;
  }

  /**
   * Send user input to the stream
   * @param {Object} input - User input data
   * @returns {boolean} Success status
   */
  sendUserInput(input) {
    if (this.pendingInputPromises.length === 0) {
      logger.warn('No pending input requests', { threadId: this.threadId });
      return false;
    }
    
    // Get the oldest pending promise
    const promiseObj = this.pendingInputPromises.shift();
    
    // Create input event
    const inputEvent = {
      id: uuidv4(),
      type: AGUIEventType.CUSTOM_EVENT,
      data: {
        inputType: 'user_response',
        input
      },
      threadId: this.threadId,
      runId: this.runId,
      timestamp: new Date().toISOString(),
      source: 'user'
    };
    
    // Buffer and broadcast event
    if (this.options.bufferEvents) {
      this._bufferEvent(inputEvent);
    }
    this._broadcastToClients(inputEvent);
    
    // Resolve the promise
    promiseObj.resolve(input);
    
    logger.info('User input received and processed', { 
      threadId: this.threadId,
      inputType: typeof input
    });
    
    // Update state
    this.state.status = 'thinking';
    super.emit('state:update', this.state);
    
    return true;
  }

  /**
   * Notify input request to pending promises
   * @private
   * @param {Object} event - Input request event
   */
  _notifyInputRequest(event) {
    // Resolve any pending input promises when request is made
    if (this.pendingInputPromises.length > 0) {
      const promiseObj = this.pendingInputPromises[0];
      // Don't resolve yet, just notify with the event
      if (promiseObj.options.notifyOnly) {
        promiseObj.notify?.(event);
      }
    }
  }

  /**
   * Reject all pending input promises
   * @private
   * @param {Error} error - Error to reject with
   */
  _rejectPendingInputs(error) {
    for (const promiseObj of this.pendingInputPromises) {
      promiseObj.reject(error);
    }
    this.pendingInputPromises = [];
  }

  /**
   * Cancel the stream
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancellation event
   */
  async cancel(reason = 'User cancelled') {
    if (this.isCancelled) {
      logger.debug('Stream already cancelled', { threadId: this.threadId });
      return null;
    }
    
    logger.info('Cancelling stream', { threadId: this.threadId, reason });
    
    // Emit cancellation event
    const event = await this.emit({
      type: AGUIEventType.CANCELLATION,
      data: { reason }
    });
    
    // Reject any pending input promises
    this._rejectPendingInputs(new Error(reason));
    
    return event;
  }

  /**
   * Complete the stream
   * @param {Object} result - Completion result
   * @returns {Promise<Object>} Completion event
   */
  async complete(result = {}) {
    if (this.isCompleted) {
      logger.debug('Stream already completed', { threadId: this.threadId });
      return null;
    }
    
    logger.info('Completing stream', { threadId: this.threadId });
    
    // Emit lifecycle end event
    const event = await this.emit({
      type: AGUIEventType.LIFECYCLE_END,
      data: { result }
    });
    
    return event;
  }

  /**
   * Get current stream state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get all buffered events
   * @returns {Array} Buffered events
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Clear all buffered events
   */
  clearEvents() {
    this.events = [];
    logger.debug('Event buffer cleared', { threadId: this.threadId });
  }

  /**
   * Create a text message event
   * @async
   * @param {string} text - Message text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created event
   */
  async sendText(text, options = {}) {
    return this.emit({
      type: AGUIEventType.TEXT_MESSAGE_CONTENT,
      data: {
        text,
        final: options.final !== false,
        ...options
      }
    });
  }

  /**
   * Create a tool call start event
   * @async
   * @param {string} tool - Tool name
   * @param {string} server - Server name
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Created event
   */
  async startToolCall(tool, server, params = {}) {
    return this.emit({
      type: AGUIEventType.TOOL_CALL_START,
      data: {
        tool,
        server,
        params
      }
    });
  }

  /**
   * Create a tool call end event
   * @async
   * @param {string} toolCallId - Tool call ID to complete
   * @param {Object} result - Tool result
   * @returns {Promise<Object>} Created event
   */
  async endToolCall(toolCallId, result) {
    return this.emit({
      type: AGUIEventType.TOOL_CALL_END,
      data: {
        toolCallId,
        result
      }
    });
  }

  /**
   * Request user input
   * @async
   * @param {string} question - Question to ask
   * @param {Object} options - Input options
   * @returns {Promise<Object>} Created event
   */
  async requestUserInput(question, options = {}) {
    return this.emit({
      type: AGUIEventType.USER_INPUT_REQUEST,
      data: {
        question,
        options
      }
    });
  }

  /**
   * Update progress
   * @async
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} step - Current step description
   * @returns {Promise<Object>} Created event
   */
  async updateProgress(progress, step) {
    return this.emit({
      type: AGUIEventType.PROGRESS_UPDATE,
      data: {
        progress,
        step
      }
    });
  }

  /**
   * Send error event
   * @async
   * @param {string|Error} error - Error message or object
   * @param {Object} details - Additional error details
   * @returns {Promise<Object>} Created event
   */
  async sendError(error, details = {}) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    
    return this.emit({
      type: AGUIEventType.ERROR,
      data: {
        error: errorMessage,
        stack: errorStack,
        ...details
      }
    });
  }

  /**
   * Send state delta update
   * @async
   * @param {Object} delta - State changes
   * @returns {Promise<Object>} Created event
   */
  async updateState(delta) {
    return this.emit({
      type: AGUIEventType.STATE_DELTA,
      data: delta
    });
  }

  /**
   * Start agent lifecycle
   * @async
   * @param {string} task - Task description
   * @param {Object} context - Initial context
   * @returns {Promise<Object>} Created event
   */
  async startLifecycle(task, context = {}) {
    return this.emit({
      type: AGUIEventType.LIFECYCLE_START,
      data: {
        task,
        context
      }
    });
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Cancel if not already cancelled
    if (!this.isCancelled) {
      this.cancel('Stream disposed');
    }
    
    // Clear all clients
    this.clients.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    logger.info('AG-UI Stream disposed', { threadId: this.threadId });
  }
}

/**
 * Server-side SSE handler for AG-UI Stream
 * @param {AGUIStream} stream - AG-UI Stream instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleSSE(stream, req, res) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  
  // Create client object
  const client = {
    id: uuidv4(),
    send: (data) => {
      res.write(`data: ${data}\n\n`);
      res.flush?.(); // Flush if available
    }
  };
  
  // Add client to stream
  const removeClient = stream.addClient(client);
  
  // Handle client disconnect
  req.on('close', () => {
    removeClient();
    logger.info('SSE client disconnected', { 
      clientId: client.id,
      threadId: stream.threadId
    });
  });
  
  // Send initial heartbeat
  client.send(JSON.stringify({
    id: uuidv4(),
    type: 'HEARTBEAT',
    threadId: stream.threadId,
    timestamp: new Date().toISOString()
  }));
  
  logger.info('SSE client connected', { 
    clientId: client.id,
    threadId: stream.threadId
  });
}

/**
 * Create Express middleware for AG-UI Stream SSE
 * @param {AGUIStream} stream - AG-UI Stream instance
 * @returns {Function} Express middleware
 */
function createSSEMiddleware(stream) {
  return (req, res, next) => {
    handleSSE(stream, req, res);
  };
}

/**
 * Create a new AG-UI Stream
 * @param {Object} options - Stream options
 * @returns {AGUIStream} New stream instance
 */
function createStream(options = {}) {
  return new AGUIStream(options);
}

module.exports = {
  AGUIStream,
  AGUIEventType,
  handleSSE,
  createSSEMiddleware,
  createStream
};
