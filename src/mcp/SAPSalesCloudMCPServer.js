const { MCPServer } = require('modelcontextprotocol');
const axios = require('axios');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sap-sales-cloud-mcp' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'sap-sales-cloud-mcp-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'sap-sales-cloud-mcp.log' })
  ]
});

/**
 * SAP Sales Cloud MCP Server Implementation
 * Provides standardized access to SAP Sales Cloud V2 APIs through Model Context Protocol
 */
class SAPSalesCloudMCPServer extends MCPServer {
  /**
   * Initialize the SAP Sales Cloud MCP Server
   * @param {string} tenantUrl - SAP tenant URL
   * @param {string} username - SAP API username
   * @param {string} password - SAP API password
   * @param {Object} options - Additional configuration options
   */
  constructor(tenantUrl, username, password, options = {}) {
    super("sap_sales_cloud");
    this.baseUrl = `https://${tenantUrl}/api/v2`;
    this.authHeader = this._createAuthHeader(username, password);
    this.timeout = options.timeout || 30000; // Default 30s timeout
    this.retryAttempts = options.retryAttempts || 3;
    
    logger.info('SAP Sales Cloud MCP Server initialized', { 
      tenant: tenantUrl,
      username,
      options
    });
  }

  /**
   * Create authentication header for SAP API requests
   * @private
   * @param {string} username - SAP API username
   * @param {string} password - SAP API password
   * @returns {Object} Authentication header
   */
  _createAuthHeader(username, password) {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return { "Authorization": `Basic ${credentials}` };
  }

  /**
   * List available tools provided by this MCP server
   * @async
   * @returns {Promise<Array>} List of available tools
   */
  async listTools() {
    try {
      logger.debug('Listing available SAP Sales Cloud tools');
      
      return [
        // Opportunity Management
        { name: "search_opportunities", description: "Search SAP opportunities" },
        { name: "create_opportunity", description: "Create new opportunity" },
        { name: "update_opportunity", description: "Update opportunity details" },
        
        // Account Management  
        { name: "search_accounts", description: "Search SAP accounts" },
        { name: "create_account", description: "Create new account" },
        { name: "get_account_hierarchy", description: "Get account relationships" },
        
        // Contact Management
        { name: "search_contacts", description: "Search SAP contacts" },
        { name: "create_contact", description: "Create new contact" },
        { name: "update_contact", description: "Update contact information" },
        
        // Activity Management
        { name: "search_activities", description: "Search activities and tasks" },
        { name: "create_activity", description: "Create new activity" },
        { name: "schedule_appointment", description: "Schedule appointments" },
        
        // Lead Management
        { name: "search_leads", description: "Search and qualify leads" },
        { name: "convert_lead", description: "Convert lead to opportunity" },
        
        // Reporting & Analytics
        { name: "get_opportunity_pipeline", description: "Get pipeline analytics" },
        { name: "get_sales_forecast", description: "Get sales forecasting data" }
      ];
    } catch (error) {
      logger.error('Error listing SAP Sales Cloud tools', { error: error.message });
      throw new Error(`Failed to list tools: ${error.message}`);
    }
  }

  /**
   * Call a specific tool with arguments
   * @async
   * @param {string} name - Tool name
   * @param {Object} arguments - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   */
  async callTool(name, arguments) {
    try {
      logger.info('Calling SAP Sales Cloud tool', { tool: name, args: arguments });
      
      let result;
      switch (name) {
        case "search_opportunities":
          result = await this._searchOpportunities(arguments);
          break;
        case "create_opportunity":
          result = await this._createOpportunity(arguments);
          break;
        case "update_opportunity":
          result = await this._updateOpportunity(arguments);
          break;
        case "search_accounts":
          result = await this._searchAccounts(arguments);
          break;
        case "create_account":
          result = await this._createAccount(arguments);
          break;
        case "get_account_hierarchy":
          result = await this._getAccountHierarchy(arguments);
          break;
        case "search_contacts":
          result = await this._searchContacts(arguments);
          break;
        case "create_contact":
          result = await this._createContact(arguments);
          break;
        case "update_contact":
          result = await this._updateContact(arguments);
          break;
        case "search_activities":
          result = await this._searchActivities(arguments);
          break;
        case "create_activity":
          result = await this._createActivity(arguments);
          break;
        case "schedule_appointment":
          result = await this._scheduleAppointment(arguments);
          break;
        case "search_leads":
          result = await this._searchLeads(arguments);
          break;
        case "convert_lead":
          result = await this._convertLead(arguments);
          break;
        case "get_opportunity_pipeline":
          result = await this._getOpportunityPipeline(arguments);
          break;
        case "get_sales_forecast":
          result = await this._getSalesForecast(arguments);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      logger.info('SAP Sales Cloud tool execution completed', { 
        tool: name, 
        success: true 
      });
      
      return result;
    } catch (error) {
      logger.error('Error executing SAP Sales Cloud tool', { 
        tool: name, 
        args: arguments, 
        error: error.message,
        stack: error.stack
      });
      
      return {
        error: `SAP Sales Cloud API error: ${error.message}`,
        status: 'failed',
        details: error.response?.data || {}
      };
    }
  }

  /**
   * List available resources provided by this MCP server
   * @async
   * @returns {Promise<Array>} List of available resources
   */
  async listResources() {
    try {
      logger.debug('Listing available SAP Sales Cloud resources');
      
      return [
        {
          uri: "sap://opportunities",
          name: "SAP Opportunities",
          description: "Access to SAP Sales Cloud opportunities"
        },
        {
          uri: "sap://accounts", 
          name: "SAP Accounts",
          description: "Access to SAP Sales Cloud accounts"
        },
        {
          uri: "sap://contacts",
          name: "SAP Contacts", 
          description: "Access to SAP Sales Cloud contacts"
        },
        {
          uri: "sap://activities",
          name: "SAP Activities",
          description: "Access to SAP Sales Cloud activities and tasks"
        },
        {
          uri: "sap://leads",
          name: "SAP Leads",
          description: "Access to SAP Sales Cloud leads"
        }
      ];
    } catch (error) {
      logger.error('Error listing SAP Sales Cloud resources', { error: error.message });
      throw new Error(`Failed to list resources: ${error.message}`);
    }
  }

  /**
   * Search opportunities in SAP Sales Cloud
   * @private
   * @async
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async _searchOpportunities(params) {
    const endpoint = `${this.baseUrl}/opportunities`;
    
    // Build query parameters for SAP API
    const queryParams = {
      "$filter": this._buildODataFilter(params.filters || {}),
      "$select": params.select || "OpportunityID,Description,SalesOrganization,ExpectedRevenueAmount",
      "$top": params.limit || 50,
      "$skip": params.offset || 0
    };
    
    if (params.orderBy) {
      queryParams["$orderby"] = params.orderBy;
    }
    
    logger.debug('Searching SAP opportunities', { params: queryParams });
    
    try {
      const response = await this._makeRequest('GET', endpoint, {
        params: queryParams
      });
      
      return {
        opportunities: response.data.value || [],
        count: response.data.value?.length || 0,
        totalCount: response.data["@odata.count"] || response.data.value?.length || 0
      };
    } catch (error) {
      logger.error('Error searching opportunities', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new opportunity in SAP Sales Cloud
   * @private
   * @async
   * @param {Object} opportunityData - Opportunity data
   * @returns {Promise<Object>} Created opportunity
   */
  async _createOpportunity(opportunityData) {
    const endpoint = `${this.baseUrl}/opportunities`;
    
    // Map to SAP Sales Cloud V2 opportunity structure
    const sapOpportunity = {
      "Description": opportunityData.name,
      "SalesOrganization": opportunityData.sales_org,
      "ExpectedRevenueAmount": opportunityData.amount,
      "ExpectedClosingDate": opportunityData.close_date,
      "ProcessingType": opportunityData.type || "01",  // Standard opportunity type
      "LifeCycleStatus": opportunityData.status || "01"  // Open status
    };
    
    // Add optional fields if provided
    if (opportunityData.account_id) {
      sapOpportunity.AccountID = opportunityData.account_id;
    }
    
    if (opportunityData.owner_id) {
      sapOpportunity.OwnerID = opportunityData.owner_id;
    }
    
    logger.debug('Creating SAP opportunity', { data: sapOpportunity });
    
    try {
      const response = await this._makeRequest('POST', endpoint, {
        data: sapOpportunity,
        headers: { "Content-Type": "application/json" }
      });
      
      return {
        opportunity_id: response.data.OpportunityID,
        status: "created",
        sap_data: response.data
      };
    } catch (error) {
      logger.error('Error creating opportunity', { 
        data: opportunityData, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update an existing opportunity in SAP Sales Cloud
   * @private
   * @async
   * @param {Object} opportunityData - Opportunity data with ID
   * @returns {Promise<Object>} Update result
   */
  async _updateOpportunity(opportunityData) {
    if (!opportunityData.id) {
      throw new Error('Opportunity ID is required for update');
    }
    
    const endpoint = `${this.baseUrl}/opportunities('${opportunityData.id}')`;
    
    // Map to SAP Sales Cloud V2 opportunity structure
    const sapOpportunity = {};
    
    if (opportunityData.name) sapOpportunity.Description = opportunityData.name;
    if (opportunityData.sales_org) sapOpportunity.SalesOrganization = opportunityData.sales_org;
    if (opportunityData.amount) sapOpportunity.ExpectedRevenueAmount = opportunityData.amount;
    if (opportunityData.close_date) sapOpportunity.ExpectedClosingDate = opportunityData.close_date;
    if (opportunityData.status) sapOpportunity.LifeCycleStatus = opportunityData.status;
    
    logger.debug('Updating SAP opportunity', { id: opportunityData.id, data: sapOpportunity });
    
    try {
      const response = await this._makeRequest('PATCH', endpoint, {
        data: sapOpportunity,
        headers: { "Content-Type": "application/json" }
      });
      
      return {
        opportunity_id: opportunityData.id,
        status: "updated",
        sap_data: response.data
      };
    } catch (error) {
      logger.error('Error updating opportunity', { 
        id: opportunityData.id, 
        data: opportunityData, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Search accounts in SAP Sales Cloud
   * @private
   * @async
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async _searchAccounts(params) {
    const endpoint = `${this.baseUrl}/accounts`;
    
    // Build query parameters for SAP API
    const queryParams = {
      "$filter": this._buildODataFilter(params.filters || {}),
      "$select": params.select || "AccountID,AccountName,Industry,Country",
      "$top": params.limit || 50,
      "$skip": params.offset || 0
    };
    
    if (params.orderBy) {
      queryParams["$orderby"] = params.orderBy;
    }
    
    logger.debug('Searching SAP accounts', { params: queryParams });
    
    try {
      const response = await this._makeRequest('GET', endpoint, {
        params: queryParams
      });
      
      return {
        accounts: response.data.value || [],
        count: response.data.value?.length || 0,
        totalCount: response.data["@odata.count"] || response.data.value?.length || 0
      };
    } catch (error) {
      logger.error('Error searching accounts', { error: error.message });
      throw error;
    }
  }

  /**
   * Helper method to build OData $filter query for SAP APIs
   * @private
   * @param {Object} filters - Filter criteria
   * @returns {string} OData filter query string
   */
  _buildODataFilter(filters) {
    const filterParts = [];
    
    if (filters.account_name) {
      filterParts.push(`contains(AccountName,'${filters.account_name}')`);
    }
    
    if (filters.stage) {
      filterParts.push(`ProcessingType eq '${filters.stage}'`);
    }
    
    if (filters.amount_min) {
      filterParts.push(`ExpectedRevenueAmount ge ${filters.amount_min}`);
    }
    
    if (filters.amount_max) {
      filterParts.push(`ExpectedRevenueAmount le ${filters.amount_max}`);
    }
    
    if (filters.close_date_from) {
      filterParts.push(`ExpectedClosingDate ge ${filters.close_date_from}`);
    }
    
    if (filters.close_date_to) {
      filterParts.push(`ExpectedClosingDate le ${filters.close_date_to}`);
    }
    
    if (filters.status) {
      filterParts.push(`LifeCycleStatus eq '${filters.status}'`);
    }
    
    if (filters.industry) {
      filterParts.push(`Industry eq '${filters.industry}'`);
    }
    
    if (filters.country) {
      filterParts.push(`Country eq '${filters.country}'`);
    }
    
    return filterParts.join(' and ');
  }

  /**
   * Make HTTP request to SAP API with retry logic and error handling
   * @private
   * @async
   * @param {string} method - HTTP method
   * @param {string} url - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async _makeRequest(method, url, options = {}) {
    let attempts = 0;
    let lastError = null;
    
    while (attempts < this.retryAttempts) {
      try {
        attempts++;
        
        const response = await axios({
          method,
          url,
          ...options,
          headers: {
            ...this.authHeader,
            ...(options.headers || {})
          },
          timeout: this.timeout
        });
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Log the error
        logger.warn(`SAP API request failed (attempt ${attempts}/${this.retryAttempts})`, {
          method,
          url,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // Don't retry for client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All attempts failed
    throw lastError;
  }

  /**
   * Stub methods for other SAP API operations
   * These would be implemented with actual API calls in a complete implementation
   */
  async _createAccount(accountData) {
    logger.info('Creating SAP account', { name: accountData.name });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _getAccountHierarchy(params) {
    logger.info('Getting SAP account hierarchy', { accountId: params.accountId });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _searchContacts(params) {
    logger.info('Searching SAP contacts', { filters: params.filters });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _createContact(contactData) {
    logger.info('Creating SAP contact', { name: contactData.name });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _updateContact(contactData) {
    logger.info('Updating SAP contact', { id: contactData.id });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _searchActivities(params) {
    logger.info('Searching SAP activities', { filters: params.filters });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _createActivity(activityData) {
    logger.info('Creating SAP activity', { type: activityData.type });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _scheduleAppointment(appointmentData) {
    logger.info('Scheduling SAP appointment', { subject: appointmentData.subject });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _searchLeads(params) {
    logger.info('Searching SAP leads', { filters: params.filters });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _convertLead(leadData) {
    logger.info('Converting SAP lead', { id: leadData.id });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _getOpportunityPipeline(params) {
    logger.info('Getting SAP opportunity pipeline', { filters: params.filters });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
  
  async _getSalesForecast(params) {
    logger.info('Getting SAP sales forecast', { period: params.period });
    // Implementation would go here
    return { status: "not_implemented", message: "Method not fully implemented" };
  }
}

module.exports = SAPSalesCloudMCPServer;
