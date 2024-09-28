const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();

console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `${process.env.ANTHROPIC_API_KEY.substr(0, 5)}...` : 'Not set');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-letter', async (req, res) => {
  try {
    const { name, disability, context } = req.body;
    if (!name || !disability || !context) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key is not set' });
    }
    
    const accommodations = await generateAccommodations(disability, context);
    const letter = generateAccommodationLetter(name, disability, accommodations, context);
    res.json({ letter, accommodations });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ 
      error: 'An error occurred', 
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack
    });
  }
});

async function generateAccommodations(disability, context) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const url = 'https://api.anthropic.com/v1/messages';
  
  console.log('Generating accommodations for:', { disability, context });
  console.log('API Key (first 5 characters):', anthropicApiKey.substring(0, 5));

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': anthropicApiKey,
    'anthropic-version': '2023-06-01'
  };

  console.log('Request headers:', JSON.stringify(headers, null, 2));

  const prompt = `For a person with the following disability: "${disability}" in a ${context} context, provide EXACTLY 10 accommodations. Focus on accommodations that:

                1. Are supported by research or best practices 
                2. Directly address core challenges associated with the disability
                3. Are implementable at an institutional level (and not just advice for the individual)
                4. Are accommodations people already use and find helpful

                Consider accommodations in, but not limited to, these categories:
                - Academic/Work Environment Modifications
                - Technological Aids
                - Assessment and Evaluation Adjustments
                - Communication and Interaction Supports
                - Time Management and Organization Assistance
                - Priority registration for courses
                - Flexibility with deadlines and provide extended time for exams if needed.

                Avoid generic, potentially stigmatizing, or personal advice suggestions. Be extensive. Ensure accommodations are appropriate for being requested from an institution.

                Provide your response as a JSON array of exactly 10 objects, where each object has a single key "accommodation" with a string value describing one accommodation. For example:
                [
                  {"accommodation": "Provide access to a quiet, distraction-reduced testing environment for exams and assessments."},
                  {"accommodation": "Allow the use of noise-cancelling headphones or earplugs during lectures and study sessions to reduce auditory distractions."},
                  ...
                ]`;

  try {
    console.log('Sending request to Anthropic API...');
    const response = await axios.post(url, {
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }, { headers });

    console.log('Response received from Anthropic API');
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(response.headers, null, 2));

    let content = response.data.content[0].text;
    console.log('Raw API response:', content);

    try {
      const suggestedAccommodations = JSON.parse(content);
      if (Array.isArray(suggestedAccommodations)) {
        // Extract the 'accommodation' value from each object
        return suggestedAccommodations.map(item => item.accommodation || 'No accommodation provided');
      } else {
        console.error('API response is not an array:', suggestedAccommodations);
        return ['Error: Unexpected response format from API'];
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Processed content:', content);
      
      // Fallback parsing method
      const suggestions = content.match(/"accommodation"\s*:\s*"([^"]*)"/g);
      if (suggestions && suggestions.length > 0) {
        return suggestions.map(suggestion => 
          suggestion.replace(/"accommodation"\s*:\s*"/, '').replace(/"$/, '')
        );
      } else {
        return ['Error: Unable to parse API response'];
      }
    }
  } catch (error) {
    console.error('Detailed error:', JSON.stringify(error.response ? error.response.data : error, null, 2));
    throw new Error('Error generating accommodations: ' + JSON.stringify(error.response ? error.response.data : error.message));
  }
}

function generateAccommodationLetter(name, disability, accommodations, context) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
${date}

To Whom It May Concern:

Re: Accommodation Request for ${name}

I am writing this letter to formally request accommodations for ${name}, who has been diagnosed with ${disability}. ${name} is a valued ${context} who requires certain accommodations to ensure equal access and opportunity in their ${context} environment.

Based on ${name}'s condition and needs, the following accommodations are recommended:

${accommodations.map((acc, index) => `${index + 1}. ${acc}`).join('\n')}

These accommodations are essential to help ${name} fully participate and succeed in their ${context} responsibilities. We kindly request your understanding and cooperation in implementing these accommodations as appropriate.

It's important to note that this list is not exhaustive, and the specific accommodations should be discussed and tailored to ${name}'s individual needs and circumstances. We encourage open communication to ensure that ${name}'s needs are met effectively.

If you require any additional information or have any questions regarding these accommodations, please don't hesitate to contact us. We are happy to provide further clarification or documentation as needed.

Thank you for your attention to this matter and your commitment to providing an inclusive environment for all.

Sincerely,

[Your Name]
[Your Title/Position]
[Your Institution/Organization]
[Contact Information]
`.trim();
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
