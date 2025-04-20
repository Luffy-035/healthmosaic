/**
 * AI model integration helpers
 */

import { ChatGroq } from "@langchain/groq";

// Initialize the Groq LLM
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama3-70b-8192",
});

/**
 * Generate a condensed medical prompt from a long input
 * @param {string} text - The medical text to analyze
 * @returns {Promise<string>} The condensed prompt
 */
export async function condensePrompt(text) {
  try {
    if (text.length < 1000) {
      return text;
    }
    
    const result = await model.invoke([
      ["system", `You are a specialized medical AI assistant. You are given long medical text that needs to be condensed into key information for further AI processing.
      
      Your task is to identify and extract only the most relevant medical information including:
      - Patient demographics
      - Primary medical conditions
      - Critical diagnoses
      - Important lab results
      - Current medications
      - Allergies
      
      Be extremely concise. Prioritize information by medical importance.`],
      ["user", `Condense the following medical text to its most critical elements:\n\n${text.substring(0, 15000)}`]
    ]);
    
    return result.content;
  } catch (error) {
    console.error('Error condensing prompt:', error);
    // Return a truncated version if error occurs
    return text.substring(0, 8000);
  }
}

/**
 * Extract specific medical entities from text
 * @param {string} text - The medical text to analyze
 * @returns {Promise<object>} Extracted medical entities
 */
export async function extractMedicalEntities(text) {
  try {
    const result = await model.invoke([
      ["system", `You are a specialized medical entity extraction AI. Extract these categories from the provided medical text:
      
      1. Medications: Names, dosages, frequencies
      2. Conditions: Any mentioned medical conditions or diagnoses
      3. Allergies: Any mentioned allergies or adverse reactions
      4. Procedures: Any medical procedures mentioned
      5. Labs: Any laboratory tests and their results
      
      Return ONLY a JSON object with these categories as keys and arrays of strings as values. If a category has no entities, return an empty array.`],
      ["user", `Extract medical entities from this text:\n\n${text}`]
    ]);
    
    // Parse the JSON from the response
    const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/) || 
                    result.content.match(/```\n([\s\S]*?)\n```/) ||
                    result.content.match(/{[\s\S]*?}/);
                    
    const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json\n/g, '').replace(/```/g, '') : result.content;
    
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Error parsing entity JSON:', e);
      // Return empty structure if parsing fails
      return {
        medications: [],
        conditions: [],
        allergies: [],
        procedures: [],
        labs: []
      };
    }
  } catch (error) {
    console.error('Error extracting medical entities:', error);
    return {
      medications: [],
      conditions: [],
      allergies: [],
      procedures: [],
      labs: []
    };
  }
}