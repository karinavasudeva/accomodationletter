const axios = require('axios');

async function generateAccommodations(disability, context) {
  const debugLog = [];
  debugLog.push('Entering generateAccommodations function');
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const url = 'https://api.anthropic.com/v1/messages';
  
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': anthropicApiKey,
    'anthropic-version': '2023-06-01'
  };

  const prompt = `For a person with the following disability: "${disability}" in a ${context} context, provide EXACTLY 10 accommodations...`; // Your existing prompt

  try {
    debugLog.push('Sending request to Anthropic API...');
    const response = await axios.post(url, {
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }, { headers });

    debugLog.push('Response received from Anthropic API');
    debugLog.push(`Response status: ${response.status}`);
    debugLog.push(`Response headers: ${JSON.stringify(response.headers)}`);
    
    let content = response.data.content[0].text;
    debugLog.push(`Raw API response: ${content}`);

    // Attempt to extract JSON array from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      content = jsonMatch[0];
      debugLog.push(`Extracted JSON: ${content}`);
    } else {
      debugLog.push('No JSON array found in the response');
    }

    // Attempt to parse the JSON response
    let suggestedAccommodations;
    try {
      suggestedAccommodations = JSON.parse(content);
      debugLog.push(`Parsed accommodations: ${JSON.stringify(suggestedAccommodations)}`);
    } catch (parseError) {
      debugLog.push(`Error parsing JSON: ${parseError}`);
      debugLog.push(`Raw content: ${content}`);
      // If parsing fails, attempt to create a valid JSON array from the content
      const accommodations = content.split('\n')
        .filter(line => line.trim().startsWith('"accommodation":'))
        .map(line => {
          const match = line.match(/"accommodation":\s*"([^"]*)"/);
          return match ? { accommodation: match[1] } : null;
        })
        .filter(item => item !== null);
      if (accommodations.length > 0) {
        suggestedAccommodations = accommodations;
        debugLog.push(`Extracted accommodations: ${JSON.stringify(suggestedAccommodations)}`);
      } else {
        throw new Error('Failed to parse API response as JSON and couldn\'t extract accommodations');
      }
    }

    if (Array.isArray(suggestedAccommodations) && suggestedAccommodations.length > 0) {
      const result = suggestedAccommodations.map(item => item.accommodation || 'No accommodation provided');
      debugLog.push(`Final accommodations: ${JSON.stringify(result)}`);
      return { accommodations: result, debugLog };
    } else {
      debugLog.push(`Unexpected response format: ${JSON.stringify(suggestedAccommodations)}`);
      throw new Error('API response is not in the expected format (array of accommodation objects)');
    }
  } catch (error) {
    debugLog.push(`Error in generateAccommodations: ${error}`);
    if (error.response) {
      debugLog.push(`Error response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

function generateAccommodationLetter(name, disability, accommodations, context) {
  // Your existing generateAccommodationLetter function
}

module.exports = async (req, res) => {
  const debugLog = ['API route called'];
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    debugLog.push(`Request body: ${JSON.stringify(req.body)}`);
    const { name, disability, context } = req.body;
    if (!name || !disability || !context) {
      debugLog.push('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields', debugLog });
    }
    
    if (!process.env.ANTHROPIC_API_KEY) {
      debugLog.push('Anthropic API key is not set');
      return res.status(500).json({ error: 'Anthropic API key is not set', debugLog });
    }
    
    debugLog.push('Generating accommodations...');
    const { accommodations, accommodationsDebugLog } = await generateAccommodations(disability, context);
    debugLog.push(...accommodationsDebugLog);
    debugLog.push(`Accommodations generated: ${JSON.stringify(accommodations)}`);
    
    debugLog.push('Generating letter...');
    const letter = generateAccommodationLetter(name, disability, accommodations, context);
    debugLog.push('Letter generated');
    
    res.status(200).json({ letter, accommodations, debugLog });
  } catch (error) {
    debugLog.push(`An error occurred: ${error}`);
    debugLog.push(`Error stack: ${error.stack}`);
    res.status(500).json({ 
      error: 'An internal server error occurred',
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
      debugLog
    });
  }
};
