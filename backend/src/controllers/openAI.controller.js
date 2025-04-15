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
        - Extract ONLY what is explicitly given — never make up details.
        - Ask friendly follow-up questions if any required information is missing.
        - Always ask for payment information (account number, account name, branch ID).
        - "As soon as you collect any valid invoice field (even just one), include the available structured data inside a
        \\\`\\\`\\\`json code block. This allows the system to populate the invoice form in real time. 
         Always include the latest collected fields in the JSON block, even if incomplete. 
         Continue the conversation normally afterward."

        📝 Output format:
        When you have enough to start forming the invoice, respond normally, **then include the data in a JSON code block like this**:

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

        Let’s roll some invoices, chef! 🍣`
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

    // Return both the conversation response and any structured data
    return res.status(200).json({
      success: true,
      message: aiResponse,
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
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Get the file path and conversation history
    const filePath = req.file.path;
    const { conversation = [] } = req.body;

    // Create a system prompt for invoice extraction
    let messages = [
      {
        role: 'system',
        content: `You are Sushi AI, an invoice data extraction assistant with a friendly, helpful personality.
        Analyze the provided invoice image and extract key information into a structured JSON format while maintaining a conversational approach.
        
        When you have extracted information, provide it in this JSON format along with your conversational response:
        {
          "invoiceId": string (optional),
          "issueDate": YYYY-MM-DD (required),
          "dueDate": YYYY-MM-DD (optional),
          "currency": three-letter currency code (required),
          "buyer": {
            "name": string (required),
            "address": {
              "street": string (optional),
              "country": two-letter country code (optional)
            },
            "phone": string (optional)
          },
          "supplier": {
            "name": string (required),
            "address": {
              "street": string (optional),
              "country": two-letter country code (optional)
            },
            "phone": string (optional),
            "email": string (optional)
          },
          "paymentAccountId": string (optional, bank account number),
          "paymentAccountName": string (optional, account name),
          "financialInstitutionBranchId": string (optional, bank branch code or routing number),
          "items": [
            {
              "name": string (required),
              "count": number (required),
              "cost": number (required),
              "currency": three-letter currency code (optional)
            }
          ],
          "taxRate": number (percentage, optional),
          "total": number (optional, calculated)
        }
        
        IMPORTANT: Always look for and include payment information (paymentAccountId, paymentAccountName, financialInstitutionBranchId) from the image. If you can't find this information, explicitly mention it's missing in your response so the user can provide it.

        Only extract fields that you can confidently identify. Be friendly and explain what you found in the image.
        If some information is missing or unclear, ask the user about it in a conversational way.`
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
            url: `data:${mimeType};base64,${base64Image}`
          }
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

module.exports = {
  createInvoiceFromText,
  createInvoiceFromImage
};