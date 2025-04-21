// utils/contentModeration.js
import OpenAI from 'openai';

// Initialize the OpenAI client if API key is available
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openai = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
} else {
  console.warn('No OpenAI API key provided. Content moderation will be bypassed.');
}

/**
 * Checks if a construction report is appropriate using OpenAI's moderation API
 * If OpenAI API key is not available, reports are automatically approved
 * 
 * @param {string} location - The location of the construction report
 * @param {string} description - The description of the construction report
 * @returns {Promise<{isAppropriate: boolean, result: object}>} - Whether the content is appropriate and the full moderation result
 */
export async function moderateConstructionReport(location, description) {
  try {
    // If no API key is provided, skip moderation and approve all reports
    if (!openai) {
      console.warn('OpenAI API key not available. Auto-approving construction report without moderation.');
      return {
        isAppropriate: true,
        isConstructionReport: true,
        result: { 
          flagged: false,
          message: 'Content moderation bypassed due to missing API key'
        }
      };
    }
    
    // Combine the location and description for analysis
    const content = `Location: ${location}\nDescription: ${description}`;
    
    // Call OpenAI's moderation API
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    
    // Check if the content is flagged by OpenAI
    const isContentFlagged = result.flagged;
    
    // Also use OpenAI to check if the content is actually a construction report
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI designed to verify if a text is actually describing a construction site on a university campus. 
          Respond with "yes" only if the text appears to be a genuine construction report, and "no" if it's unrelated content, 
          spam, nonsense, or anything that's not a construction report. Only respond with "yes" or "no".`
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0,
      max_tokens: 5
    });
    
    const isConstructionReport = completion.choices[0].message.content.toLowerCase().includes("yes");
    
    // Report is appropriate if it's not flagged AND it's actually a construction report
    const isAppropriate = !isContentFlagged && isConstructionReport;
    
    return {
      isAppropriate,
      isConstructionReport,
      result
    };
  } catch (error) {
    console.error('Error during content moderation:', error);
    // In case of an error, we default to appropriate to avoid blocking legitimate reports
    // In a production environment, you might want to implement more sophisticated error handling
    return {
      isAppropriate: true,
      isConstructionReport: true,
      result: { error: error.message }
    };
  }
}
