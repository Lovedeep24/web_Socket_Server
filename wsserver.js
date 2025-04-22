import axios from 'axios';
const chatHistories = {};
export async function getEducationalAnswer(chatId,question) {
  if (!chatId || !question) {
    throw new Error('Missing userId or question');
  }

  const apiKey = process.env.MISTRAL_API_KEY;

  if (!chatHistories[chatId]) {
    chatHistories[chatId] = [
      {
        role: 'system',
        content:
        `You are an AI tutor participating in an educational discussion. Always answer in a compact paragraph with no line breaks, no bullet points, and no numbered lists. Do not format responses with 1., 2.,  \n1 or anything like \n. Write naturally, using complete sentences. Also if chat is asked away from the educational discussion, you should say "I am not sure about that, but I can help you with educational questions."`,
      
      },
    ];
  }

  chatHistories[chatId].push({
    role: 'user',
    content: question,
  });

  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-tiny',
        messages: chatHistories[chatId],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const botReply = response.data.choices[0].message.content;

    chatHistories[chatId].push({
      role: 'assistant',
      content: botReply,
    });

    return botReply;
  } catch (err) {
    console.error('Mistral API error:', err.response?.data || err.message);
    throw new Error('Failed to get response from Mistral');
  }
}
