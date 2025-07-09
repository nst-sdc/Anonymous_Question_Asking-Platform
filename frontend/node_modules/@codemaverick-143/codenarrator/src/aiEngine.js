// @ts-check
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🚨 IMPORTANT: This is a private key - DO NOT COMMIT TO GITHUB
// For development, use aiEngine.template.js instead
const EMBEDDED_API_KEY = 'AIzaSyDogEE6z042tkYJGw7lcVuvLkjmMMLiybU'; // Replace with your actual key

if (!EMBEDDED_API_KEY) {
  console.error('❌ Gemini API key is missing!');
  process.exit(1);
}

// Model configuration - using the latest stable model
const MODEL_NAME = "gemini-1.5-flash";

// Initialize the Google Generative AI client with the embedded key
const genAI = new GoogleGenerativeAI(EMBEDDED_API_KEY);

/**
 * Calls the Gemini API to generate content
 * @param {string} prompt - The prompt to send to the model
 * @param {string} [apiKey] - Optional API key (uses embedded key if not provided)
 * @returns {Promise<string>} The generated content
 * @throws {Error} If the API key is missing or the request fails
 */
export async function callGemini(prompt, apiKey) {
  const effectiveApiKey = apiKey || EMBEDDED_API_KEY;
  
  if (!effectiveApiKey) {
    throw new Error('Gemini API key is required');
  }

  // Use the embedded genAI instance if keys match, otherwise create a new one
  const client = effectiveApiKey === EMBEDDED_API_KEY 
    ? genAI 
    : new GoogleGenerativeAI(effectiveApiKey);

  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Prompt must be a non-empty string');
  }

  try {
    if (process.env.VERBOSE) {
      console.log(`🤖 Using model: ${MODEL_NAME}`);
    }
    
    // Get the Gemini Pro model with generation config
    const model = client.getGenerativeModel({ 
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    // Generate content
    if (process.env.VERBOSE) {
      console.log('📤 Sending request to Gemini API...');
      console.log(`📝 Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    }
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No content generated - empty response');
    }
    
    if (process.env.VERBOSE) {
      console.log(`✅ Received response (${text.length} characters)`);
    }
    
    return text;
  } catch (error) {
    console.error('❌ Error calling Gemini API:');
    
    // Provide more detailed error information
    let errorMessage = 'Failed to generate content';
    if (error.response) {
      errorMessage += `: ${JSON.stringify(error.response.data, null, 2)}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Lists all available models for the API key
 * @param {string} [apiKey] - Optional API key (uses embedded key if not provided)
 * @returns {Promise<Array>} List of available models
 */
export async function listAvailableModels(apiKey) {
  const effectiveApiKey = apiKey || EMBEDDED_API_KEY;
  
  if (!effectiveApiKey) {
    throw new Error('Gemini API key is required to list models');
  }

  try {
    const client = effectiveApiKey === EMBEDDED_API_KEY 
      ? genAI 
      : new GoogleGenerativeAI(effectiveApiKey);
      
    const model = client.getGenerativeModel({ model: MODEL_NAME });
    
    // Test if we can use the model
    await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    
    // If we get here, the model is available
    return [{ name: MODEL_NAME }];
  } catch (error) {
    console.error('❌ Error testing model access:', error.message);
    throw new Error(`Failed to access model: ${error.message}`);
  }
}
