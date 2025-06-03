const winston = require('winston');
const EventEmitter = require('events');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-server-manager' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mcp-server-manager-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'mcp-server-manager.log' })
  ]
});

/**
 * MCPServerManager
 * Manages multiple MCP servers and provides a unified interface for tool execution
 * and resource discovery across all servers.
 */
class MCPServerManager extends EventEmitter {
  /**
   * Initialize the MCP Server Manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    this.servers = new Map();
    this.healthStatus = new Map();
    this.options = {
      healthCheckInterval: options.healthCheckInterval || 60000, // 1 minute
      serverTimeout: options.serverTimeout || 30000, // 30 seconds
      enableFallback: options.enableFallback !== false, // Default true
      maxRetries: options.maxRetries || 3,
      ...options
    };
    
    // Start health monitoring if enabled
    if (this.options.enableHealthCheck !== false) {
      this._startHealthMonitoring();
    }
    
    logger.info('MCP Server Manager initialized', { options: this.options });
  }

  /**
   * Register a new MCP server
   * @param {string} name - Server name
   * @param {Object} server - MCP server instance
   * @param {Object} config - Server configuration
   * @returns {boolean} Success status
   */
  registerServer(name, server, config = {}) {
    try {
      if (this.servers.has(name)) {
        logger.warn(`Server '${name}' already registered, replacing`);
      }
      
      this.servers.set(name, {
        instance: server,
        config: {
          priority: config.priority || 0,
          fallbackServers: config.fallbackServers || [],
          enabled: config.enabled !== false,
          timeout: config.timeout || this.options.serverTimeout,
          ...config
        },
        stats: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          lastCallTime: null,
          averageResponseTime: 0
        }
      });
      
      // Initialize health status
      this.healthStatus.set(name, {
        status: 'unknown',
        lastChecked: null,
        isAvailable: true,
        error: null
      });
      
      // Perform initial health check
      this._checkServerHealth(name);
      
      logger.info(`MCP server '${name}' registered`, { config });
      this.emit('server:registered', { name, config });
      
      return true;
    } catch (error) {
      logger.error(`Failed to register server '${name}'`, { error: error.message });
      this.emit('server:error', { name, error: error.message });
      return false;
    }
  }

  /**
   * Unregister an MCP server
   * @param {string} name - Server name
   * @returns {boolean} Success status
   */
  unregisterServer(name) {
    if (!this.servers.has(name)) {
      logger.warn(`Server '${name}' not found, cannot unregister`);
      return false;
    }
    
    this.servers.delete(name);
    this.healthStatus.delete(name);
    
    logger.info(`MCP server '${name}' unregistered`);
    this.emit('server:unregistered', { name });
    
    return true;
  }

  /**
   * Get all registered server names
   * @returns {Array<string>} Server names
   */
  getServerNames() {
    return Array.from(this.servers.keys());
  }

  /**
   * Get a specific server instance
   * @param {string} name - Server name
   * @returns {Object|null} Server instance or null if not found
   */
  getServer(name) {
    const server = this.servers.get(name);
    return server ? server.instance : null;
  }

  /**
   * Get server configuration
   * @param {string} name - Server name
   * @returns {Object|null} Server configuration or null if not found
   */
  getServerConfig(name) {
    const server = this.servers.get(name);
    return server ? server.config : null;
  }

  /**
   * Get server health status
   * @param {string} name - Server name
   * @returns {Object|null} Server health status or null if not found
   */
  getServerHealth(name) {
    return this.healthStatus.get(name) || null;
  }

  /**
   * Get health status for all servers
   * @returns {Object} Health status for all servers
   */
  getAllServerHealth() {
    const health = {};
    for (const [name, status] of this.healthStatus.entries()) {
      health[name] = status;
    }
    return health;
  }

  /**
   * Execute a tool on a specific MCP server
   * @async
   * @param {string} serverName - Server name
   * @param {string} toolName - Tool name
   * @param {Object} params - Tool parameters
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(serverName, toolName, params = {}, options = {}) {
    const serverEntry = this.servers.get(serverName);
    
    if (!serverEntry) {
      logger.error(`Server '${serverName}' not found`);
      throw new Error(`Server '${serverName}' not found`);
    }
    
    if (!serverEntry.config.enabled) {
      logger.warn(`Server '${serverName}' is disabled`);
      
      // Try fallback if enabled
      if (this.options.enableFallback && options.enableFallback !== false) {
        return this._executeFallbackTool(serverName, toolName, params, options);
      }
      
      throw new Error(`Server '${serverName}' is disabled`);
    }
    
    const server = serverEntry.instance;
    const startTime = Date.now();
    
    try {
      logger.info(`Executing tool '${toolName}' on server '${serverName}'`, { params });
      this.emit('tool:start', { serverName, toolName, params });
      
      // Update stats
      serverEntry.stats.totalCalls++;
      serverEntry.stats.lastCallTime = startTime;
      
      // Execute the tool with timeout
      const result = await Promise.race([
        server.callTool(toolName, params),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Tool execution timed out after ${serverEntry.config.timeout}ms`));
          }, serverEntry.config.timeout);
        })
      ]);
      
      // Calculate response time and update stats
      const responseTime = Date.now() - startTime;
      serverEntry.stats.successfulCalls++;
      serverEntry.stats.averageResponseTime = 
        (serverEntry.stats.averageResponseTime * (serverEntry.stats.successfulCalls - 1) + responseTime) / 
        serverEntry.stats.successfulCalls;
      
      logger.info(`Tool '${toolName}' executed successfully on server '${serverName}'`, { 
        responseTime,
        resultSize: JSON.stringify(result).length
      });
      
      this.emit('tool:success', { 
        serverName, 
        toolName, 
        responseTime,
        result
      });
      
      return result;
    } catch (error) {
      // Update stats
      serverEntry.stats.failedCalls++;
      
      logger.error(`Failed to execute tool '${toolName}' on server '${serverName}'`, { 
        error: error.message,
        stack: error.stack
      });
      
      this.emit('tool:error', { 
        serverName, 
        toolName, 
        error: error.message 
      });
      
      // Try fallback if enabled
      if (this.options.enableFallback && options.enableFallback !== false) {
        return this._executeFallbackTool(serverName, toolName, params, options);
      }
      
      throw error;
    }
  }

  /**
   * Execute a tool on a fallback server
   * @private
   * @async
   * @param {string} primaryServerName - Primary server name
   * @param {string} toolName - Tool name
   * @param {Object} params - Tool parameters
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Tool execution result
   */
  async _executeFallbackTool(primaryServerName, toolName, params, options = {}) {
    const primaryServer = this.servers.get(primaryServerName);
    
    if (!primaryServer || !primaryServer.config.fallbackServers || primaryServer.config.fallbackServers.length === 0) {
      logger.error(`No fallback servers configured for '${primaryServerName}'`);
      throw new Error(`No fallback servers available for '${primaryServerName}'`);
    }
    
    // Try each fallback server in order
    for (const fallbackServerName of primaryServer.config.fallbackServers) {
      const fallbackServer = this.servers.get(fallbackServerName);
      
      if (!fallbackServer || !fallbackServer.config.enabled) {
        logger.warn(`Fallback server '${fallbackServerName}' not available`);
        continue;
      }
      
      try {
        logger.info(`Trying fallback server '${fallbackServerName}' for tool '${toolName}'`);
        
        // Disable fallback for this execution to prevent infinite recursion
        const fallbackOptions = { ...options, enableFallback: false };
        
        // Execute on fallback server
        const result = await this.executeTool(fallbackServerName, toolName, params, fallbackOptions);
        
        logger.info(`Successfully executed tool '${toolName}' on fallback server '${fallbackServerName}'`);
        
        this.emit('fallback:success', { 
          primaryServerName, 
          fallbackServerName, 
          toolName 
        });
        
        return result;
      } catch (error) {
        logger.error(`Fallback server '${fallbackServerName}' failed for tool '${toolName}'`, { 
          error: error.message 
        });
        
        this.emit('fallback:error', { 
          primaryServerName, 
          fallbackServerName, 
          toolName, 
          error: error.message 
        });
      }
    }
    
    // All fallbacks failed
    logger.error(`All fallback servers failed for '${primaryServerName}' and tool '${toolName}'`);
    throw new Error(`All fallback servers failed for '${primaryServerName}' and tool '${toolName}'`);
  }

  /**
   * List all available tools across all servers
   * @async
   * @returns {Promise<Object>} Tools grouped by server
   */
  async listAllTools() {
    const allTools = {};
    
    for (const [serverName, serverEntry] of this.servers.entries()) {
      if (!serverEntry.config.enabled) {
        continue;
      }
      
      try {
        const tools = await serverEntry.instance.listTools();
        allTools[serverName] = tools;
      } catch (error) {
        logger.error(`Failed to list tools for server '${serverName}'`, { 
          error: error.message 
        });
        allTools[serverName] = { error: error.message };
      }
    }
    
    return allTools;
  }

  /**
   * Find servers that provide a specific tool
   * @async
   * @param {string} toolName - Tool name
   * @returns {Promise<Array>} List of server names that provide the tool
   */
  async findServersForTool(toolName) {
    const serversWithTool = [];
    
    for (const [serverName, serverEntry] of this.servers.entries()) {
      if (!serverEntry.config.enabled) {
        continue;
      }
      
      try {
        const tools = await serverEntry.instance.listTools();
        if (tools.some(tool => tool.name === toolName)) {
          serversWithTool.push(serverName);
        }
      } catch (error) {
        logger.error(`Failed to check tools for server '${serverName}'`, { 
          error: error.message 
        });
      }
    }
    
    return serversWithTool;
  }

  /**
   * List all available resources across all servers
   * @async
   * @returns {Promise<Object>} Resources grouped by server
   */
  async listAllResources() {
    const allResources = {};
    
    for (const [serverName, serverEntry] of this.servers.entries()) {
      if (!serverEntry.config.enabled) {
        continue;
      }
      
      try {
        const resources = await serverEntry.instance.listResources();
        allResources[serverName] = resources;
      } catch (error) {
        logger.error(`Failed to list resources for server '${serverName}'`, { 
          error: error.message 
        });
        allResources[serverName] = { error: error.message };
      }
    }
    
    return allResources;
  }

  /**
   * Start health monitoring for all servers
   * @private
   */
  _startHealthMonitoring() {
    this.healthCheckInterval = setInterval(() => {
      for (const serverName of this.servers.keys()) {
        this._checkServerHealth(serverName);
      }
    }, this.options.healthCheckInterval);
    
    logger.info(`Health monitoring started with interval ${this.options.healthCheckInterval}ms`);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Health monitoring stopped');
    }
  }

  /**
   * Check health of a specific server
   * @private
   * @async
   * @param {string} serverName - Server name
   */
  async _checkServerHealth(serverName) {
    const serverEntry = this.servers.get(serverName);
    
    if (!serverEntry) {
      logger.warn(`Cannot check health for unknown server '${serverName}'`);
      return;
    }
    
    const server = serverEntry.instance;
    const healthStatus = this.healthStatus.get(serverName) || {
      status: 'unknown',
      lastChecked: null,
      isAvailable: false,
      error: null
    };
    
    try {
      // Simple health check - try to list tools
      const startTime = Date.now();
      
      // Execute with timeout
      await Promise.race([
        server.listTools(),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Health check timed out after ${serverEntry.config.timeout}ms`));
          }, serverEntry.config.timeout);
        })
      ]);
      
      const responseTime = Date.now() - startTime;
      
      // Update health status
      healthStatus.status = 'healthy';
      healthStatus.lastChecked = new Date();
      healthStatus.isAvailable = true;
      healthStatus.error = null;
      healthStatus.responseTime = responseTime;
      
      logger.debug(`Server '${serverName}' health check passed`, { responseTime });
      this.emit('health:check', { serverName, status: 'healthy', responseTime });
    } catch (error) {
      // Update health status
      healthStatus.status = 'unhealthy';
      healthStatus.lastChecked = new Date();
      healthStatus.isAvailable = false;
      healthStatus.error = error.message;
      
      logger.warn(`Server '${serverName}' health check failed`, { error: error.message });
      this.emit('health:check', { serverName, status: 'unhealthy', error: error.message });
    }
    
    // Update health status map
    this.healthStatus.set(serverName, healthStatus);
  }

  /**
   * Get statistics for all servers
   * @returns {Object} Server statistics
   */
  getServerStats() {
    const stats = {};
    
    for (const [serverName, serverEntry] of this.servers.entries()) {
      stats[serverName] = { ...serverEntry.stats };
    }
    
    return stats;
  }

  /**
   * Reset statistics for a specific server
   * @param {string} serverName - Server name
   * @returns {boolean} Success status
   */
  resetServerStats(serverName) {
    const serverEntry = this.servers.get(serverName);
    
    if (!serverEntry) {
      logger.warn(`Cannot reset stats for unknown server '${serverName}'`);
      return false;
    }
    
    serverEntry.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      lastCallTime: null,
      averageResponseTime: 0
    };
    
    logger.info(`Statistics reset for server '${serverName}'`);
    return true;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stopHealthMonitoring();
    
    // Clear all listeners
    this.removeAllListeners();
    
    logger.info('MCP Server Manager disposed');
  }
}

module.exports = MCPServerManager;
