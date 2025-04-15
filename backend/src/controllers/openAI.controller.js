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
        content: `You are Sushi AI, an invoice creation assistant with a friendly, helpful personality. 
        Your goal is to help the user create an invoice by extracting structured information from their input in a conversational way.
        Always maintain the conversation and ask follow-up questions when information is missing or unclear.
        
        When you have collected enough information, provide the structured data in JSON format along with your conversational response.
        The invoice should include:
        {
          "invoiceId": string (optional, can generate if not provided),
          "issueDate": YYYY-MM-DD (required),
          "dueDate": YYYY-MM-DD (optional),
          "currency": three-letter currency code (required, default to USD),
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
        
        Only extract information that is clearly provided. Don't make up information.
        Be conversational and friendly in your responses. Use a sushi-themed personality.`
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
      model: 'gpt-4o',
      messages,
      temperature: 0.7, // Higher for more conversational tone
      max_tokens: 2000
    });

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
      model: 'gpt-4-mini',
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