// backend/src/controllers/openai.controller.js
const { OpenAI } = require('openai');
const fs = require('fs');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Process text prompt for invoice creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createInvoiceFromText = async (req, res) => {
  try {
    const { prompt, conversation = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Prompt is required' 
      });
    }

    // Prepare system message with context about invoice creation
    let messages = [
      {
        role: 'system',
        content: `You are Sushi AI 🍣, a friendly and helpful invoice creation assistant. 
        Your goal is to guide users through creating an invoice by asking smart follow-up questions and extracting clear, structured information from their input.
        
        Be charming, sushi-themed, and conversational — like a sushi chef helping a customer build their perfect invoice roll. When enough info is collected, generate structured invoice data.

        🎯 Your mission:
        - "As soon as you collect any valid invoice field (even from first user input), include the available structured data inside a
        \\\`\\\`\\\`json code block. This allows the system to populate the invoice form in real time. 
        - Always include the latest collected fields in the JSON block, even if incomplete. 
         Continue the conversation normally afterward."
        - Always include the payment information in the JSON block, even if incomplete.
        - IMPORTANT:Do not display the json object as text in message just output the json object.


        📝 Output format:
        - Always output the JSON code block with the latest collected fields and ask for more details
        if required 
        - When all required fields are collected, let the user know all required field are collected
        - If user chose to remove a field when all all collected data is present, then it should go back to displaying pre-fill invoivce
        with collected data part.
        **then include the data in a JSON code block like this**:

        \`\`\`json
        {
        "invoiceId": "string (optional, can generate if not provided)",
        "issueDate": "YYYY-MM-DD (required)",
        "dueDate": "YYYY-MM-DD (optional)",
        "currency": "three-letter currency code (required, default to USD)",
        "buyer": {
            "name": "string (required)",
            "address": {
            "street": "string (optional)",
            "country": "two-letter country code (optional)"
            },
            "phone": "string (optional)"
        },
        "supplier": {
            "name": "string (required)",
            "address": {
            "street": "string (optional)",
            "country": "two-letter country code (optional)"
            },
            "phone": "string (optional)",
            "email": "string (optional)"
        },
        "paymentAccountId": "string (optional)",
        "paymentAccountName": "string (optional)",
        "financialInstitutionBranchId": "string (optional)",
        "items": [
            {
            "name": "string (required)",
            "count": number (required),
            "cost": number (required),
            "currency": "three-letter currency code (optional)"
            }
        ],
        "taxRate": number (optional),
        "total": number (optional)
        }
        \`\`\`
    
        Let's roll some invoices, chef! 🍣`
      }
    ];
    
    // Add conversation history if provided
    if (conversation && conversation.length > 0) {
      // Only add the messages with role user or assistant
      const validMessages = conversation.filter(
        msg => msg.role === 'user' || msg.role === 'assistant'
      );
      messages = [...messages, ...validMessages];
    }
    
    // Add the new user message
    messages.push({
      role: 'user',
      content: prompt
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7, // Higher for more conversational tone
      max_tokens: 2000
    });

    // Extract response
    const aiResponse = completion.choices[0].message.content;
    console.log(aiResponse);
    
    // Try to extract JSON from the response if it exists
    let invoiceData = null;
    try {
      // Look for JSON in the response
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                  aiResponse.match(/```[\s\S]*?({[\s\S]*})[\s\S]*?```/) ||
                  aiResponse.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        invoiceData = JSON.parse(jsonStr);
        
        
        console.log(invoiceData);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Continue without invoice data if parsing fails
    }

    // Remove the JSON block for the user-facing message
    const displayMessage = aiResponse.replace(/```json\s*([\s\S]*?)\s*```/, '').trim();

    // Return both the conversation response and any structured data
    return res.status(200).json({
      success: true,
      message: displayMessage,
      data: invoiceData,
      hasInvoiceData: invoiceData !== null
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
};

/**
 * Process image for invoice creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createInvoiceFromImage = async (req, res) => {
  try {
    console.log("Processing image upload request");
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Get the file path and conversation history
    const filePath = req.file.path;
    
    // Parse conversation history from form data
    let conversation = [];
    try {
      if (req.body.conversation) {
        conversation = JSON.parse(req.body.conversation);
        if (!Array.isArray(conversation)) {
          console.log("Conversation is not an array, setting to empty array");
          conversation = [];
        }
      }
    } catch (error) {
      console.error("Error parsing conversation JSON:", error);
      conversation = [];
    }

    // Create a system prompt for invoice extraction
    let messages = [
      {
        role: 'system',
        content: `You are Sushi AI 🍣, a friendly and helpful invoice creation assistant. 
        Your goal is to guide users through creating an invoice by asking smart follow-up questions and extracting clear, structured information from their input.
        
        Be charming, sushi-themed, and conversational — like a sushi chef helping a customer build their perfect invoice roll. When enough info is collected, generate structured invoice data.

        🎯 Your mission:
        - "As soon as you collect any valid invoice field (even from first user input), include the available structured data inside a
        \\\`\\\`\\\`json code block. This allows the system to populate the invoice form in real time. 
        - Always include the latest collected fields in the JSON block, even if incomplete. 
         Continue the conversation normally afterward."
        - Always include the payment information in the JSON block, even if incomplete.
        - IMPORTANT:Do not display the json object as text in message just output the json object.


        📝 Output format:
        - Always output the JSON code block with the latest collected fields and ask for more details
        if required 
        - When all required fields are collected, let the user know all required field are collected
        - If user chose to remove a field when all all collected data is present, then it should go back to displaying pre-fill invoivce
        with collected data part.
        **then include the data in a JSON code block like this**:

        \`\`\`json
        {
        "invoiceId": "string (optional, can generate if not provided)",
        "issueDate": "YYYY-MM-DD (required)",
        "dueDate": "YYYY-MM-DD (optional)",
        "currency": "three-letter currency code (required, default to USD)",
        "buyer": {
            "name": "string (required)",
            "address": {
            "street": "string (optional)",
            "country": "two-letter country code (optional)"
            },
            "phone": "string (optional)"
        },
        "supplier": {
            "name": "string (required)",
            "address": {
            "street": "string (optional)",
            "country": "two-letter country code (optional)"
            },
            "phone": "string (optional)",
            "email": "string (optional)"
        },
        "paymentAccountId": "string (optional)",
        "paymentAccountName": "string (optional)",
        "financialInstitutionBranchId": "string (optional)",
        "items": [
            {
            "name": "string (required)",
            "count": number (required),
            "cost": number (required),
            "currency": "three-letter currency code (optional)"
            }
        ],
        "taxRate": number (optional),
        "total": number (optional)
        }
        \`\`\`
    
        Let's roll some invoices, chef! 🍣`
      }
    ];
    
    // Add conversation history if provided
    if (conversation && conversation.length > 0) {
      const validMessages = conversation.filter(
        msg => msg.role === 'user' || msg.role === 'assistant'
      );
      messages = [...messages, ...validMessages];
    }

    // Read file as base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Add the image to the messages
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`          }
        },
        {
          type: 'text',
          text: 'Please extract the invoice data from this image.'
        }
      ]
    });

    // Call OpenAI API with vision capabilities
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    // Extract response
    const aiResponse = completion.choices[0].message.content;
    
    // Try to extract JSON from the response if it exists
    let invoiceData = null;
    try {
      // Look for JSON in the response
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        aiResponse.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        invoiceData = JSON.parse(jsonStr);
        
        // Ensure payment fields are always present in the data
        if (invoiceData) {
          invoiceData.paymentAccountId = invoiceData.paymentAccountId || '';
          invoiceData.paymentAccountName = invoiceData.paymentAccountName || '';
          invoiceData.financialInstitutionBranchId = invoiceData.financialInstitutionBranchId || '';
        }
        
        console.log(invoiceData);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Continue without invoice data if parsing fails
    }

    // Return both the conversation response and any structured data
    return res.status(200).json({
      success: true,
      message: aiResponse,
      data: invoiceData,
      hasInvoiceData: invoiceData !== null
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Clean up the file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error processing image',
      error: error.message
    });
  }
};

// Create a new assistant for general enquires; handles all non creation related enquires
const createAssistant = async (req, res) => {
  try {
    const { prompt, conversation = [], currentPage } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    let messages = [
      {
        role: 'system',
        content: `You are Sushi AI 🍣, a friendly and helpful assistant. You are able to answer any question related to the invoice creation process and help users with their current task.

        You have access to the following capabilities:
        1. General Information:
           - Answer questions about Sushi Invoice
           - Explain features and functionality
           - Provide guidance on using the system
        
        2. Page-Specific Actions:
           ${currentPage ? `
           Current Page: ${currentPage.path}
           Page Data: ${JSON.stringify(currentPage.data)}
           ` : ''}
           
           Based on the current page, you can:
           - On invoice pages: Validate invoices, view details, send invoices
           - On dashboard: Help with navigation, explain statistics
           - On settings: Assist with configuration
           - On creation pages: Guide through the creation process

        3. Available Actions:
           - Validate invoice: If on an invoice page, can trigger validation
           - Send invoice: If on an invoice page, can help send the invoice
           - View details: Can explain any visible information
           - Navigate: Can suggest relevant pages to visit
           - Create: Can guide through creation processes

        4. Schema Validation:
           - Available schemas: peppol, fairwork
           - When user requests validation, ask which schemas they want to validate against
           - If user doesn't specify schemas, use both by default
           - Always confirm validation request before proceeding

        When responding:
        1. Be concise but helpful
        2. If you can perform an action, mention it explicitly
        3. If you need more information, ask for it
        4. Use the page context to provide relevant help
        5. If you can't help with something, say so politely
        6. For validation requests, always include the schemas in the action response
        `
      }
    ];
    
    // Add conversation history if provided
    if (conversation && conversation.length > 0) {
      const validMessages = conversation.filter(
        msg => msg.role === 'user' || msg.role === 'assistant'
      );
      messages = [...messages, ...validMessages];
    }
    
    // Add the new user message
    messages.push({
      role: 'user',
      content: prompt
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;

    // Check if the response contains any actionable commands
    const actions = [];
    if (currentPage?.path?.includes('/invoices/') && currentPage?.data?.invoiceId) {
      if (aiResponse.toLowerCase().includes('validate')) {
        // Extract schemas from the response if specified
        const schemas = [];
        if (aiResponse.toLowerCase().includes('peppol')) schemas.push('peppol');
        if (aiResponse.toLowerCase().includes('fairwork')) schemas.push('fairwork');
        
        // If no schemas specified, use both
        const selectedSchemas = schemas.length > 0 ? schemas : ['peppol', 'fairwork'];
        
        actions.push({
          type: 'validate',
          invoiceId: currentPage.data.invoiceId,
          schemas: selectedSchemas,
          message: `I'll validate this invoice against ${selectedSchemas.join(' and ')} schemas. Click the validate button to confirm.`,
          confirmButton: {
            label: 'Validate',
            action: 'confirm_validation'
          }
        });
      }
      if (aiResponse.toLowerCase().includes('send')) {
        actions.push({
          type: 'send',
          invoiceId: currentPage.data.invoiceId
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: aiResponse,
      actions
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
};

module.exports = {
  createInvoiceFromText,
  createInvoiceFromImage,
  createAssistant
};
