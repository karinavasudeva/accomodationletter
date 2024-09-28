const axios = require('axios');

async function generateAccommodations(disability, context) {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const url = 'https://api.anthropic.com/v1/messages';
  
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': anthropicApiKey,
    'anthropic-version': '2023-06-01'
  };

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

                Provide your response as a JSON array of exactly 10 objects, where each object has a single key "accommodation" with a string value describing one accommodation.`;

  try {
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

    let content = response.data.content[0].text;
    const suggestedAccommodations = JSON.parse(content);
    if (Array.isArray(suggestedAccommodations)) {
      return suggestedAccommodations.map(item => item.accommodation || 'No accommodation provided');
    } else {
      throw new Error('API response is not in the expected format');
    }
  } catch (error) {
    console.error('Error generating accommodations:', error);
    throw error;
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

module.exports = async (req, res) => {
  if (req.method === 'POST') {
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
      res.status(200).json({ letter, accommodations });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ 
        error: 'An error occurred', 
        details: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }

module.exports = async (req, res) => {
  console.log('API route called');
  if (req.method === 'POST') {
    try {
      console.log('Request body:', req.body);
      const { name, disability, context } = req.body;
      if (!name || !disability || !context) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Anthropic API key is not set');
        return res.status(500).json({ error: 'Anthropic API key is not set' });
      }
      
      console.log('Generating accommodations...');
      const accommodations = await generateAccommodations(disability, context);
      console.log('Accommodations generated:', accommodations);
      
      console.log('Generating letter...');
      const letter = generateAccommodationLetter(name, disability, accommodations, context);
      console.log('Letter generated');
      
      res.status(200).json({ letter, accommodations });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ 
        error: 'An error occurred', 
        details: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
