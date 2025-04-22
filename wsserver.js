import { WebSocketServer } from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws) => {
  const chatHistory = [
    {
      role: 'system',
      content: `You are an AI tutor participating in an educational discussion. Always answer in a compact paragraph with no line breaks, no bullet points, and no numbered lists. Do not format responses with 1., 2.,  \n1 or anything like \n. Write naturally, using complete sentences. Also if chat is asked away from the educational discussion, you should say "I am not sure about that, but I can help you with educational questions."`,
    },
  ];

  ws.on('message', async (message) => {
    try {
      const { question } = JSON.parse(message);

      if (!question) {
        ws.send(JSON.stringify({ error: 'Missing question' }));
        return;
      }

      chatHistory.push({
        role: 'user',
        content: question,
      });

      const apiKey = process.env.MISTRAL_API_KEY;

      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-tiny',
          messages: chatHistory,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botReply = response.data.choices[0].message.content;

      chatHistory.push({
        role: 'assistant',
        content: botReply,
      });

      ws.send(JSON.stringify({ answer: botReply }));
    } catch (error) {
      console.error('Error:', error);
      ws.send(JSON.stringify({ error: 'Something went wrong' }));
    }
  });

  ws.send(JSON.stringify({ info: 'Connected to WebSocket server' }));
});

console.log(' WebSocket server running on ws://localhost:3001');
