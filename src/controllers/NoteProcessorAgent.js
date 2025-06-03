const { AGUIEventType } = require('../ag-ui/AGUIStream');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'note-processor-agent' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'note-processor-agent-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'note-processor-agent.log' })
  ]
});

/**
 * NoteProcessorAgent
 * AI agent for processing notes, extracting information, and interacting with SAP Sales Cloud
 */
class NoteProcessorAgent {
  /**
   * Initialize the Note Processor Agent
   * @param {Object} mcpManager - MCP Server Manager instance
   * @param {Object} options - Configuration options
   */
  constructor(mcpManager, options = {}) {
    this.mcpManager = mcpManager;
    this.options = {
      defaultModel: options.defaultModel || 'gemini-pro',
      summarizationConfidence: options.summarizationConfidence || 0.85,
      actionItemConfidence: options.actionItemConfidence || 0.8,
      maxRetries: options.maxRetries || 3,
      ...options
    };
    
    logger.info('Note Processor Agent initialized', { options: this.options });
  }

  /**
   * Process a note with real-time updates
   * @async
   * @param {Object} note - Note object to process
   * @param {Object} stream - AG-UI Stream instance
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processNote(note, stream, options = {}) {
    try {
      // Start lifecycle
      await stream.startLifecycle('Processing note', { noteId: note.id });
      
      // Send initial text message
      await stream.sendText('Starting note analysis...', { final: false });
      
      // Update progress
      await stream.updateProgress(10, 'Analyzing note content');
      
      // Clean up and format note content
      const formattedContent = await this._cleanupNoteContent(note.originalContent, stream);
      
      // Update progress
      await stream.updateProgress(30, 'Extracting key information');
      
      // Extract entities and context
      const extractedInfo = await this._extractEntities(formattedContent, note.accountId, stream);
      
      // Update progress
      await stream.updateProgress(50, 'Generating summary');
      
      // Generate summary
      const summary = await this._generateSummary(formattedContent, extractedInfo, stream);
      
      // Update progress
      await stream.updateProgress(70, 'Identifying action items');
      
      // Extract action items
      const actionItems = await this._extractActionItems(formattedContent, extractedInfo, stream);
      
      // Update progress
      await stream.updateProgress(85, 'Syncing with SAP Sales Cloud');
      
      // Sync with SAP Sales Cloud if enabled
      let sapSyncResult = null;
      if (options.syncWithSAP !== false) {
        sapSyncResult = await this._syncWithSAPSalesCloud(
          note, 
          extractedInfo, 
          actionItems, 
          stream
        );
      }
      
      // Prepare final result
      const result = {
        noteId: note.id,
        formattedContent,
        summary,
        actionItems,
        extractedInfo,
        sapSyncResult,
        processingDetails: {
          model: this.options.defaultModel,
          processedAt: new Date().toISOString(),
          confidence: {
            summary: extractedInfo.summaryConfidence || 0,
            actionItems: extractedInfo.actionItemConfidence || 0,
            entities: extractedInfo.entityConfidence || 0
          }
        }
      };
      
      // Update state with final result
      await stream.updateState({ result });
      
      // Update progress
      await stream.updateProgress(100, 'Processing complete');
      
      // Send completion message
      await stream.sendText('Note processing complete!', { final: true });
      
      // Complete lifecycle
      await stream.complete(result);
      
      logger.info('Note processing completed', { 
        noteId: note.id,
        actionItemCount: actionItems.length,
        summaryLength: summary.length
      });
      
      return result;
    } catch (error) {
      logger.error('Error processing note', { 
        noteId: note.id, 
        error: error.message,
        stack: error.stack
      });
      
      // Send error event
      await stream.sendError(error, { noteId: note.id });
      
      throw error;
    }
  }

  /**
   * Clean up and format note content
   * @private
   * @async
   * @param {string} content - Original note content
   * @param {Object} stream - AG-UI Stream instance
   * @returns {Promise<string>} Formatted content
   */
  async _cleanupNoteContent(content, stream) {
    try {
      // Start tool execution
      const toolEvent = await stream.startToolCall('cleanup_note', 'ai_service', { contentLength: content.length });
      
      // Simulate AI processing
      await this._simulateProcessingDelay(500);
      
      // Simple cleanup logic (would be replaced with actual AI call)
      let formattedContent = content.trim();
      
      // Remove extra whitespace
      formattedContent = formattedContent.replace(/\s+/g, ' ');
      
      // Fix common typos (simplified example)
      const typoFixes = {
        'teh': 'the',
        'adn': 'and',
        'waht': 'what',
        'taht': 'that'
      };
      
      Object.entries(typoFixes).forEach(([typo, fix]) => {
        const regex = new RegExp(`\\b${typo}\\b`, 'gi');
        formattedContent = formattedContent.replace(regex, fix);
      });
      
      // Format paragraphs
      formattedContent = formattedContent
        .replace(/\n{3,}/g, '\n\n')
        .replace(/([.!?])\s+/g, '$1\n');
      
      // End tool execution
      await stream.endToolCall(toolEvent.id, { formattedContent });
      
      // Send text update
      await stream.sendText('Note content cleaned and formatted.', { final: true });
      
      return formattedContent;
    } catch (error) {
      logger.error('Error cleaning up note content', { error: error.message });
      throw new Error(`Failed to clean up note content: ${error.message}`);
    }
  }

  /**
   * Extract entities and context from note content
   * @private
   * @async
   * @param {string} content - Formatted note content
   * @param {string} accountId - Account ID
   * @param {Object} stream - AG-UI Stream instance
   * @returns {Promise<Object>} Extracted entities and context
   */
  async _extractEntities(content, accountId, stream) {
    try {
      // Start tool execution
      const toolEvent = await stream.startToolCall('extract_entities', 'ai_service', { 
        contentLength: content.length,
        accountId
      });
      
      // Simulate AI processing
      await this._simulateProcessingDelay(800);
      
      // Get account information from SAP Sales Cloud
      let accountInfo = null;
      try {
        // Send update about fetching account info
        await stream.sendText('Fetching account information from SAP Sales Cloud...', { final: false });
        
        // Start SAP tool call
        const sapToolEvent = await stream.startToolCall('search_accounts', 'sap_sales_cloud', {
          filters: { account_id: accountId }
        });
        
        // Execute MCP tool
        const accountResult = await this.mcpManager.executeTool(
          'sap_sales_cloud',
          'search_accounts',
          { filters: { account_id: accountId } }
        );
        
        // End SAP tool call
        await stream.endToolCall(sapToolEvent.id, accountResult);
        
        if (accountResult.accounts && accountResult.accounts.length > 0) {
          accountInfo = accountResult.accounts[0];
          await stream.sendText(`Found account: ${accountInfo.AccountName}`, { final: true });
        } else {
          await stream.sendText('Account information not found in SAP Sales Cloud.', { final: true });
        }
      } catch (error) {
        logger.error('Error fetching account info from SAP', { 
          error: error.message, 
          accountId 
        });
        await stream.sendText('Could not fetch account information from SAP Sales Cloud.', { final: true });
      }
      
      // Simulate entity extraction (would be replaced with actual AI call)
      // Extract people mentioned
      const peopleRegex = /([A-Z][a-z]+ [A-Z][a-z]+)/g;
      const peopleMatches = content.match(peopleRegex) || [];
      const people = [...new Set(peopleMatches)]; // Remove duplicates
      
      // Extract dates
      const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4})/g;
      const dateMatches = content.match(dateRegex) || [];
      const dates = [...new Set(dateMatches)]; // Remove duplicates
      
      // Extract monetary values
      const moneyRegex = /\$\d+(?:,\d+)*(?:\.\d+)?/g;
      const moneyMatches = content.match(moneyRegex) || [];
      const monetaryValues = [...new Set(moneyMatches)]; // Remove duplicates
      
      // Extract potential products
      const productRegex = /([A-Z][a-zA-Z]+ (?:Suite|Platform|Software|Solution|System|Tool))/g;
      const productMatches = content.match(productRegex) || [];
      const products = [...new Set(productMatches)]; // Remove duplicates
      
      // Extract potential company names (simplified)
      const companyRegex = /([A-Z][a-zA-Z]+ (?:Inc|LLC|Ltd|GmbH|Corp|Corporation|Company))/g;
      const companyMatches = content.match(companyRegex) || [];
      const companies = [...new Set(companyMatches)]; // Remove duplicates
      
      // Prepare extracted info
      const extractedInfo = {
        entities: {
          people,
          dates,
          monetaryValues,
          products,
          companies
        },
        account: accountInfo,
        entityConfidence: 0.85, // Simulated confidence score
        summaryConfidence: 0.9, // Simulated confidence score
        actionItemConfidence: 0.87 // Simulated confidence score
      };
      
      // End tool execution
      await stream.endToolCall(toolEvent.id, { extractedInfo });
      
      // Send text update with extracted entities
      await stream.sendText(`Extracted ${people.length} people, ${dates.length} dates, and ${products.length} products from the note.`, { final: true });
      
      return extractedInfo;
    } catch (error) {
      logger.error('Error extracting entities', { error: error.message });
      throw new Error(`Failed to extract entities: ${error.message}`);
    }
  }

  /**
   * Generate summary from note content
   * @private
   * @async
   * @param {string} content - Formatted note content
   * @param {Object} extractedInfo - Extracted entities and context
   * @param {Object} stream - AG-UI Stream instance
   * @returns {Promise<string>} Generated summary
   */
  async _generateSummary(content, extractedInfo, stream) {
    try {
      // Start tool execution
      const toolEvent = await stream.startToolCall('generate_summary', 'ai_service', { 
        contentLength: content.length
      });
      
      // Simulate AI processing
      await this._simulateProcessingDelay(1000);
      
      // Simulate summary generation (would be replaced with actual AI call)
      // Simple summary generation logic
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Take first sentence and a few important ones
      let summary = sentences[0] || '';
      
      // Add sentences that contain extracted entities
      const importantSentences = sentences.filter(sentence => {
        // Check if sentence contains any extracted entities
        return (
          extractedInfo.entities.people.some(person => sentence.includes(person)) ||
          extractedInfo.entities.products.some(product => sentence.includes(product)) ||
          extractedInfo.entities.monetaryValues.some(value => sentence.includes(value))
        );
      });
      
      // Add up to 3 important sentences to the summary
      if (importantSentences.length > 0) {
        summary += ' ' + importantSentences.slice(0, 3).join('. ') + '.';
      }
      
      // End tool execution
      await stream.endToolCall(toolEvent.id, { summary });
      
      // Stream the summary generation with progressive updates
      const summaryWords = summary.split(' ');
      let progressiveSummary = '';
      
      for (let i = 0; i < summaryWords.length; i += 5) {
        const chunk = summaryWords.slice(i, i + 5).join(' ');
        progressiveSummary += ' ' + chunk;
        await stream.sendText(`Generating summary: ${progressiveSummary.trim()}...`, { final: false });
        await this._simulateProcessingDelay(200);
      }
      
      await stream.sendText(`Summary: ${summary}`, { final: true });
      
      return summary;
    } catch (error) {
      logger.error('Error generating summary', { error: error.message });
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Extract action items from note content
   * @private
   * @async
   * @param {string} content - Formatted note content
   * @param {Object} extractedInfo - Extracted entities and context
   * @param {Object} stream - AG-UI Stream instance
   * @returns {Promise<Array>} Extracted action items
   */
  async _extractActionItems(content, extractedInfo, stream) {
    try {
      // Start tool execution
      const toolEvent = await stream.startToolCall('extract_action_items', 'ai_service', { 
        contentLength: content.length
      });
      
      // Simulate AI processing
      await this._simulateProcessingDelay(1200);
      
      // Simulate action item extraction (would be replaced with actual AI call)
      // Look for common action item patterns
      const actionPatterns = [
        { regex: /(?:need to|must|should|will) ([^.!?]+)/gi, priority: 'medium' },
        { regex: /(?:urgent|immediately|asap)[^.!?]*([^.!?]+)/gi, priority: 'high' },
        { regex: /follow(?:-|\s)up (?:with|on) ([^.!?]+)/gi, priority: 'medium' },
        { regex: /schedule(?:d)? (?:a |an )?(?:call|meeting) ([^.!?]+)/gi, priority: 'medium' },
        { regex: /(?:send|prepare|create|update) ([^.!?]+)/gi, priority: 'medium' }
      ];
      
      const actionItems = [];
      
      // Extract action items based on patterns
      actionPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
          const description = match[1].trim();
          
          // Skip if too short
          if (description.length < 5) continue;
          
          // Check for duplicates
          if (actionItems.some(item => item.description.includes(description))) continue;
          
          // Create action item
          const actionItem = {
            description,
            priority: pattern.priority,
            status: 'pending',
            dueDate: this._suggestDueDate(description, extractedInfo.entities.dates),
            assignedTo: this._suggestAssignee(description, extractedInfo.entities.people)
          };
          
          actionItems.push(actionItem);
        }
      });
      
      // End tool execution
      await stream.endToolCall(toolEvent.id, { actionItems });
      
      // Send progressive updates about action items
      if (actionItems.length === 0) {
        await stream.sendText('No action items identified in this note.', { final: true });
      } else {
        await stream.sendText(`Identified ${actionItems.length} action items:`, { final: false });
        
        for (const [index, item] of actionItems.entries()) {
          await this._simulateProcessingDelay(300);
          await stream.sendText(`${index + 1}. ${item.description} (${item.priority} priority)${item.assignedTo ? ` - Assigned to: ${item.assignedTo}` : ''}${item.dueDate ? ` - Due: ${item.dueDate}` : ''}`, { final: false });
        }
        
        await stream.sendText('Action items extraction complete.', { final: true });
      }
      
      return actionItems;
    } catch (error) {
      logger.error('Error extracting action items', { error: error.message });
      throw new Error(`Failed to extract action items: ${error.message}`);
    }
  }

  /**
   * Suggest due date for action item
   * @private
   * @param {string} description - Action item description
   * @param {Array} extractedDates - Dates extracted from note
   * @returns {string|null} Suggested due date
   */
  _suggestDueDate(description, extractedDates) {
    // Check if description contains date-related keywords
    const urgentKeywords = ['urgent', 'immediately', 'asap', 'today', 'now'];
    const shortTermKeywords = ['tomorrow', 'next day', 'this week'];
    const mediumTermKeywords = ['next week', 'next month'];
    
    // Check for dates in the description
    for (const date of extractedDates) {
      if (description.includes(date)) {
        return date;
      }
    }
    
    // Suggest based on keywords
    if (urgentKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    if (shortTermKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    if (mediumTermKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    // Default: 3 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    return defaultDate.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Suggest assignee for action item
   * @private
   * @param {string} description - Action item description
   * @param {Array} extractedPeople - People extracted from note
   * @returns {string|null} Suggested assignee
   */
  _suggestAssignee(description, extractedPeople) {
    // Check for assignee in the description
    const assignmentPatterns = [
      { regex: /([A-Z][a-z]+ [A-Z][a-z]+) (?:will|should|to) /i, group: 1 },
      { regex: /(?:assign|assigned to) ([A-Z][a-z]+ [A-Z][a-z]+)/i, group: 1 },
      { regex: /(?:ask|tell|remind) ([A-Z][a-z]+ [A-Z][a-z]+) to/i, group: 1 }
    ];
    
    // Check each pattern
    for (const pattern of assignmentPatterns) {
      const match = description.match(pattern.regex);
      if (match && match[pattern.group]) {
        const potentialAssignee = match[pattern.group];
        
        // Verify against extracted people
        if (extractedPeople.includes(potentialAssignee)) {
          return potentialAssignee;
        }
      }
    }
    
    // Check if any extracted person is mentioned in the description
    for (const person of extractedPeople) {
      if (description.includes(person)) {
        return person;
      }
    }
    
    return null; // No assignee identified
  }

  /**
   * Sync note information with SAP Sales Cloud
   * @private
   * @async
   * @param {Object} note - Note object
   * @param {Object} extractedInfo - Extracted entities and context
   * @param {Array} actionItems - Extracted action items
   * @param {Object} stream - AG-UI Stream instance
   * @returns {Promise<Object>} Sync result
   */
  async _syncWithSAPSalesCloud(note, extractedInfo, actionItems, stream) {
    try {
      // Start tool execution
      const toolEvent = await stream.startToolCall('sync_with_sap', 'sap_sales_cloud', { 
        noteId: note.id,
        accountId: note.accountId
      });
      
      // Send update
      await stream.sendText('Syncing information with SAP Sales Cloud...', { final: false });
      
      // Create activity in SAP
      const activityData = {
        type: 'Note',
        subject: note.title || 'Meeting Notes',
        description: note.originalContent,
        account_id: note.accountId,
        date: new Date().toISOString()
      };
      
      // Execute MCP tool to create activity
      const activityResult = await this.mcpManager.executeTool(
        'sap_sales_cloud',
        'create_activity',
        activityData
      );
      
      // Process action items that need to be synced
      const syncedActionItems = [];
      
      for (const actionItem of actionItems) {
        // Only sync high and medium priority items
        if (actionItem.priority === 'low') continue;
        
        try {
          // Create task in SAP
          const taskData = {
            type: 'Task',
            subject: actionItem.description,
            priority: actionItem.priority,
            due_date: actionItem.dueDate,
            assigned_to: actionItem.assignedTo,
            account_id: note.accountId,
            status: 'Open'
          };
          
          // Execute MCP tool to create task
          const taskResult = await this.mcpManager.executeTool(
            'sap_sales_cloud',
            'create_activity',
            taskData
          );
          
          syncedActionItems.push({
            description: actionItem.description,
            sapTaskId: taskResult.activity_id,
            status: 'synced'
          });
          
          // Send progress update
          await stream.sendText(`Created task in SAP: ${actionItem.description}`, { final: false });
        } catch (error) {
          logger.error('Error creating task in SAP', { 
            description: actionItem.description, 
            error: error.message 
          });
          
          syncedActionItems.push({
            description: actionItem.description,
            error: error.message,
            status: 'failed'
          });
          
          // Send error update
          await stream.sendText(`Failed to create task in SAP: ${actionItem.description}`, { final: false });
        }
      }
      
      // Check if we need to update opportunity information
      let opportunityResult = null;
      
      if (extractedInfo.entities.monetaryValues.length > 0) {
        // Ask user if they want to update opportunity
        await stream.sendText('Found monetary values in the note. Would you like to update an opportunity?', { final: true });
        
        // Request user input
        await stream.requestUserInput('Update opportunity with this information?', {
          options: [
            { value: 'yes', label: 'Yes, update opportunity' },
            { value: 'no', label: 'No, skip this step' }
          ]
        });
        
        // Wait for user input
        const userInput = await stream.waitForInput({ timeout: 60000 });
        
        if (userInput && userInput.value === 'yes') {
          // Find opportunities for this account
          const opportunitiesResult = await this.mcpManager.executeTool(
            'sap_sales_cloud',
            'search_opportunities',
            { filters: { account_id: note.accountId } }
          );
          
          if (opportunitiesResult.opportunities && opportunitiesResult.opportunities.length > 0) {
            // Ask user which opportunity to update
            const opportunityOptions = opportunitiesResult.opportunities.map(opp => ({
              value: opp.OpportunityID,
              label: `${opp.Description} - $${opp.ExpectedRevenueAmount}`
            }));
            
            await stream.sendText('Found the following opportunities:', { final: true });
            
            // Request user to select opportunity
            await stream.requestUserInput('Select an opportunity to update:', {
              options: opportunityOptions
            });
            
            // Wait for user selection
            const opportunitySelection = await stream.waitForInput({ timeout: 60000 });
            
            if (opportunitySelection && opportunitySelection.value) {
              // Get monetary value to use
              const monetaryValue = extractedInfo.entities.monetaryValues[0];
              const amount = parseFloat(monetaryValue.replace(/[$,]/g, ''));
              
              // Update opportunity with new amount
              opportunityResult = await this.mcpManager.executeTool(
                'sap_sales_cloud',
                'update_opportunity',
                {
                  id: opportunitySelection.value,
                  amount: amount
                }
              );
              
              await stream.sendText(`Updated opportunity with amount ${monetaryValue}`, { final: true });
            }
          } else {
            await stream.sendText('No opportunities found for this account.', { final: true });
          }
        }
      }
      
      // Prepare sync result
      const syncResult = {
        activityCreated: activityResult.status === 'created',
        activityId: activityResult.activity_id,
        syncedActionItems,
        opportunityUpdated: opportunityResult ? true : false,
        opportunityDetails: opportunityResult
      };
      
      // End tool execution
      await stream.endToolCall(toolEvent.id, syncResult);
      
      // Send final update
      await stream.sendText('Sync with SAP Sales Cloud completed.', { final: true });
      
      return syncResult;
    } catch (error) {
      logger.error('Error syncing with SAP Sales Cloud', { error: error.message });
      
      // Send error update
      await stream.sendText(`Error syncing with SAP Sales Cloud: ${error.message}`, { final: true });
      
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Simulate AI processing delay
   * @private
   * @async
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async _simulateProcessingDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate an email draft based on note content
   * @async
   * @param {Object} note - Note object
   * @param {Object} stream - AG-UI Stream instance
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Email draft
   */
  async generateEmailDraft(note, stream, options = {}) {
    try {
      // Start lifecycle
      await stream.startLifecycle('Generating email draft', { noteId: note.id });
      
      // Send initial text message
      await stream.sendText('Starting email draft generation...', { final: false });
      
      // Update progress
      await stream.updateProgress(20, 'Analyzing note content');
      
      // Process note to extract relevant information
      const processedInfo = await this._extractEntities(note.originalContent, note.accountId, stream);
      
      // Update progress
      await stream.updateProgress(40, 'Identifying key points for email');
      
      // Identify recipients
      let recipients = [];
      if (processedInfo.entities && processedInfo.entities.people) {
        recipients = processedInfo.entities.people;
      }
      
      // If we have account info, try to find primary contact
      if (processedInfo.account && processedInfo.account.contacts) {
        const primaryContact = processedInfo.account.contacts.find(c => c.isPrimary);
        if (primaryContact) {
          recipients.push(primaryContact.name);
        }
      }
      
      // Update progress
      await stream.updateProgress(60, 'Drafting email content');
      
      // Simulate email draft generation
      await this._simulateProcessingDelay(1500);
      
      // Generate email subject
      let subject = '';
      if (note.title) {
        subject = `Follow-up: ${note.title}`;
      } else if (processedInfo.account) {
        subject = `Follow-up from our meeting - ${processedInfo.account.AccountName}`;
      } else {
        subject = 'Follow-up from our recent meeting';
      }
      
      // Generate email body (simplified example)
      let body = `Hello${recipients.length > 0 ? ' ' + recipients[0].split(' ')[0] : ''},\n\n`;
      body += `Thank you for your time during our recent meeting. I wanted to follow up on a few key points we discussed:\n\n`;
      
      // Add summary points
      const summaryPoints = note.originalContent
        .split(/[.!?]+/)
        .filter(s => s.trim().length > 10)
        .slice(0, 3)
        .map(s => `- ${s.trim()}`);
      
      body += summaryPoints.join('\n');
      body += '\n\n';
      
      // Add action items section if available
      const actionItems = await this._extractActionItems(note.originalContent, processedInfo, stream);
      if (actionItems.length > 0) {
        body += `Next steps:\n`;
        actionItems.forEach((item, index) => {
          body += `${index + 1}. ${item.description}\n`;
        });
        body += '\n';
      }
      
      // Add closing
      body += `Please let me know if you have any questions or if there's anything else I can help with.\n\n`;
      body += `Best regards,\n[Your Name]`;
      
      // Create email draft
      const emailDraft = {
        to: recipients.join(', '),
        subject,
        body,
        attachments: [],
        cc: options.cc || '',
        bcc: options.bcc || ''
      };
      
      // Update progress
      await stream.updateProgress(80, 'Finalizing email draft');
      
      // Stream the email content progressively
      await stream.sendText(`Subject: ${subject}`, { final: false });
      await this._simulateProcessingDelay(300);
      
      const bodyLines = body.split('\n');
      for (let i = 0; i < bodyLines.length; i += 3) {
        const chunk = bodyLines.slice(i, i + 3).join('\n');
        await stream.sendText(chunk, { final: false });
        await this._simulateProcessingDelay(200);
      }
      
      // Update progress
      await stream.updateProgress(100, 'Email draft complete');
      
      // Send completion message
      await stream.sendText('Email draft generation complete!', { final: true });
      
      // Complete lifecycle
      await stream.complete(emailDraft);
      
      logger.info('Email draft generated', { 
        noteId: note.id,
        subject,
        recipientCount: recipients.length
      });
      
      return emailDraft;
    } catch (error) {
      logger.error('Error generating email draft', { 
        noteId: note.id, 
        error: error.message,
        stack: error.stack
      });
      
      // Send error event
      await stream.sendError(error, { noteId: note.id });
      
      throw error;
    }
  }

  /**
   * Schedule a meeting based on note content
   * @async
   * @param {Object} note - Note object
   * @param {Object} stream - AG-UI Stream instance
   * @param {Object} options - Meeting options
   * @returns {Promise<Object>} Meeting details
   */
  async scheduleMeeting(note, stream, options = {}) {
    try {
      // Start lifecycle
      await stream.startLifecycle('Scheduling meeting', { noteId: note.id });
      
      // Send initial text message
      await stream.sendText('Starting meeting scheduling...', { final: false });
      
      // Update progress
      await stream.updateProgress(20, 'Analyzing note content for meeting details');
      
      // Process note to extract relevant information
      const processedInfo = await this._extractEntities(note.originalContent, note.accountId, stream);
      
      // Update progress
      await stream.updateProgress(40, 'Identifying participants and timing');
      
      // Identify participants
      let participants = [];
      if (processedInfo.entities && processedInfo.entities.people) {
        participants = processedInfo.entities.people;
      }
      
      // If we have account info, try to find contacts
      if (processedInfo.account && processedInfo.account.contacts) {
        processedInfo.account.contacts.forEach(contact => {
          if (!participants.includes(contact.name)) {
            participants.push(contact.name);
          }
        });
      }
      
      // Identify potential meeting dates
      let suggestedDates = [];
      if (processedInfo.entities && processedInfo.entities.dates) {
        suggestedDates = processedInfo.entities.dates;
      }
      
      // If no dates found, suggest dates in the next week
      if (suggestedDates.length === 0) {
        const today = new Date();
        for (let i = 1; i <= 5; i++) {
          const date = new Date();
          date.setDate(today.getDate() + i);
          suggestedDates.push(date.toISOString().split('T')[0]);
        }
      }
      
      // Update progress
      await stream.updateProgress(60, 'Generating meeting proposal');
      
      // Generate meeting subject
      let subject = '';
      if (note.title) {
        subject = `Follow-up Meeting: ${note.title}`;
      } else if (processedInfo.account) {
        subject = `Meeting with ${processedInfo.account.AccountName}`;
      } else {
        subject = 'Follow-up Meeting';
      }
      
      // Generate meeting description
      let description = `Follow-up meeting based on our previous discussion.\n\n`;
      description += `Agenda:\n`;
      
      // Add action items as agenda points
      const actionItems = await this._extractActionItems(note.originalContent, processedInfo, stream);
      if (actionItems.length > 0) {
        actionItems.forEach((item, index) => {
          description += `${index + 1}. Discuss: ${item.description}\n`;
        });
      } else {
        description += `1. Review progress\n`;
        description += `2. Discuss next steps\n`;
      }
      
      // Determine meeting duration
      let duration = 30; // Default 30 minutes
      if (actionItems.length > 3) {
        duration = 60; // 60 minutes for more complex meetings
      }
      
      // Create meeting proposal
      const meetingProposal = {
        subject,
        description,
        participants,
        suggestedDates,
        duration,
        location: options.location || 'Virtual Meeting'
      };
      
      // Update progress
      await stream.updateProgress(80, 'Finalizing meeting details');
      
      // Request user confirmation
      await stream.sendText('Meeting proposal ready. Please review the details:', { final: true });
      await stream.sendText(`Subject: ${subject}`, { final: true });
      await stream.sendText(`Participants: ${participants.join(', ')}`, { final: true });
      await stream.sendText(`Duration: ${duration} minutes`, { final: true });
      await stream.sendText(`Suggested dates: ${suggestedDates.join(', ')}`, { final: true });
      
      // Request user input for confirmation
      await stream.requestUserInput('Would you like to schedule this meeting?', {
        options: [
          { value: 'yes', label: 'Yes, schedule the meeting' },
          { value: 'modify', label: 'Modify details first' },
          { value: 'no', label: 'No, cancel' }
        ]
      });
      
      // Wait for user input
      const userInput = await stream.waitForInput({ timeout: 60000 });
      
      let meetingResult = null;
      
      if (userInput && userInput.value === 'yes') {
        // Schedule the meeting in SAP Sales Cloud
        try {
          // Start SAP tool call
          const sapToolEvent = await stream.startToolCall('schedule_appointment', 'sap_sales_cloud', {
            subject,
            description,
            participants,
            date: suggestedDates[0], // Use first suggested date
            duration,
            account_id: note.accountId
          });
          
          // Execute MCP tool
          meetingResult = await this.mcpManager.executeTool(
            'sap_sales_cloud',
            'schedule_appointment',
            {
              subject,
              description,
              participants,
              date: suggestedDates[0],
              duration,
              account_id: note.accountId
            }
          );
          
          // End SAP tool call
          await stream.endToolCall(sapToolEvent.id, meetingResult);
          
          // Send success message
          await stream.sendText(`Meeting scheduled successfully for ${suggestedDates[0]}.`, { final: true });
        } catch (error) {
          logger.error('Error scheduling meeting in SAP', { error: error.message });
          await stream.sendText(`Error scheduling meeting: ${error.message}`, { final: true });
          
          meetingResult = {
            status: 'error',
            error: error.message
          };
        }
      } else if (userInput && userInput.value === 'modify') {
        // Request modifications
        await stream.sendText('Please modify the meeting details directly in your calendar application.', { final: true });
        
        meetingResult = {
          status: 'modified',
          proposal: meetingProposal
        };
      } else {
        // Cancelled by user
        await stream.sendText('Meeting scheduling cancelled.', { final: true });
        
        meetingResult = {
          status: 'cancelled',
          proposal: meetingProposal
        };
      }
      
      // Update progress
      await stream.updateProgress(100, 'Meeting scheduling complete');
      
      // Complete lifecycle
      await stream.complete({
        meetingProposal,
        result: meetingResult
      });
      
      logger.info('Meeting scheduling completed', { 
        noteId: note.id,
        subject,
        status: meetingResult.status
      });
      
      return {
        meetingProposal,
        result: meetingResult
      };
    } catch (error) {
      logger.error('Error scheduling meeting', { 
        noteId: note.id, 
        error: error.message,
        stack: error.stack
      });
      
      // Send error event
      await stream.sendError(error, { noteId: note.id });
      
      throw error;
    }
  }

  /**
   * Chat with AI about note content
   * @async
   * @param {Object} note - Note object
   * @param {string} userMessage - User message
   * @param {Object} stream - AG-UI Stream instance
   * @param {Object} options - Chat options
   * @returns {Promise<Object>} Chat result
   */
  async chatWithAI(note, userMessage, stream, options = {}) {
    try {
      // Start lifecycle
      await stream.startLifecycle('AI Chat', { 
        noteId: note.id,
        message: userMessage
      });
      
      // Send thinking message
      await stream.sendText('Thinking...', { final: false });
      
      // Update progress
      await stream.updateProgress(30, 'Processing your question');
      
      // Process note if not already processed
      let processedInfo = options.processedInfo;
      if (!processedInfo) {
        processedInfo = await this._extractEntities(note.originalContent, note.accountId, stream);
      }
      
      // Update progress
      await stream.updateProgress(60, 'Generating response');
      
      // Simulate AI thinking
      await this._simulateProcessingDelay(1000);
      
      // Generate response based on user message and note content
      let response = '';
      
      // Simple pattern matching for demo purposes
      // In a real implementation, this would use a proper LLM
      if (userMessage.toLowerCase().includes('summarize')) {
        response = await this._generateSummary(note.originalContent, processedInfo, stream);
      } else if (userMessage.toLowerCase().includes('action') || userMessage.toLowerCase().includes('task')) {
        const actionItems = await this._extractActionItems(note.originalContent, processedInfo, stream);
        response = `I found ${actionItems.length} action items in the note:\n\n`;
        actionItems.forEach((item, index) => {
          response += `${index + 1}. ${item.description}\n`;
          if (item.assignedTo) response += `   Assigned to: ${item.assignedTo}\n`;
          if (item.dueDate) response += `   Due: ${item.dueDate}\n`;
          response += `   Priority: ${item.priority}\n`;
        });
      } else if (userMessage.toLowerCase().includes('people') || userMessage.toLowerCase().includes('who')) {
        response = `People mentioned in the note:\n\n`;
        if (processedInfo.entities.people.length > 0) {
          processedInfo.entities.people.forEach((person, index) => {
            response += `${index + 1}. ${person}\n`;
          });
        } else {
          response += `No specific people were identified in this note.`;
        }
      } else if (userMessage.toLowerCase().includes('date') || userMessage.toLowerCase().includes('when')) {
        response = `Dates mentioned in the note:\n\n`;
        if (processedInfo.entities.dates.length > 0) {
          processedInfo.entities.dates.forEach((date, index) => {
            response += `${index + 1}. ${date}\n`;
          });
        } else {
          response += `No specific dates were identified in this note.`;
        }
      } else if (userMessage.toLowerCase().includes('product') || userMessage.toLowerCase().includes('what')) {
        response = `Products mentioned in the note:\n\n`;
        if (processedInfo.entities.products.length > 0) {
          processedInfo.entities.products.forEach((product, index) => {
            response += `${index + 1}. ${product}\n`;
          });
        } else {
          response += `No specific products were identified in this note.`;
        }
      } else if (userMessage.toLowerCase().includes('money') || userMessage.toLowerCase().includes('amount') || userMessage.toLowerCase().includes('value')) {
        response = `Monetary values mentioned in the note:\n\n`;
        if (processedInfo.entities.monetaryValues.length > 0) {
          processedInfo.entities.monetaryValues.forEach((value, index) => {
            response += `${index + 1}. ${value}\n`;
          });
        } else {
          response += `No specific monetary values were identified in this note.`;
        }
      } else if (userMessage.toLowerCase().includes('email') || userMessage.toLowerCase().includes('draft')) {
        // Redirect to email draft generation
        await stream.sendText('Let me generate an email draft based on this note...', { final: true });
        return this.generateEmailDraft(note, stream, options);
      } else if (userMessage.toLowerCase().includes('meeting') || userMessage.toLowerCase().includes('schedule')) {
        // Redirect to meeting scheduling
        await stream.sendText('Let me help you schedule a meeting based on this note...', { final: true });
        return this.scheduleMeeting(note, stream, options);
      } else if (userMessage.toLowerCase().includes('sap') || userMessage.toLowerCase().includes('sync')) {
        // Sync with SAP
        await stream.sendText('Syncing information with SAP Sales Cloud...', { final: true });
        return this._syncWithSAPSalesCloud(note, processedInfo, [], stream);
      } else {
        // Generic response
        response = `I've analyzed this note and found:\n\n`;
        response += `- ${processedInfo.entities.people.length} people mentioned\n`;
        response += `- ${processedInfo.entities.dates.length} dates mentioned\n`;
        response += `- ${processedInfo.entities.products.length} products mentioned\n`;
        response += `- ${processedInfo.entities.monetaryValues.length} monetary values mentioned\n\n`;
        response += `You can ask me to summarize the note, extract action items, draft an email, or schedule a meeting based on this content.`;
      }
      
      // Update progress
      await stream.updateProgress(90, 'Finalizing response');
      
      // Stream the response with progressive updates
      const responseLines = response.split('\n');
      for (let i = 0; i < responseLines.length; i++) {
        await stream.sendText(responseLines[i], { final: false });
        await this._simulateProcessingDelay(100);
      }
      
      // Update progress
      await stream.updateProgress(100, 'Response complete');
      
      // Send completion message
      await stream.sendText('Is there anything else you would like to know about this note?', { final: true });
      
      // Complete lifecycle
      await stream.complete({
        message: userMessage,
        response
      });
      
      logger.info('AI chat completed', { 
        noteId: note.id,
        message: userMessage,
        responseLength: response.length
      });
      
      return {
        message: userMessage,
        response
      };
    } catch (error) {
      logger.error('Error in AI chat', { 
        noteId: note.id, 
        message: userMessage,
        error: error.message,
        stack: error.stack
      });
      
      // Send error event
      await stream.sendError(error, { noteId: note.id });
      
      throw error;
    }
  }
}

module.exports = NoteProcessorAgent;
