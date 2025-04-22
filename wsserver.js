// wsServer.js
import { WebSocketServer } from 'ws';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const wss = new WebSocketServer({ port: 3001 });

const chatHistories = {};  // Use an object to store chat histories by user/session

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const { question, chatId } = JSON.parse(message);  // Expecting a `chatId` from client

      if (!question) {
        ws.send(JSON.stringify({ error: 'Missing question' }));
        return;
      }

      // Ensure chat history exists for the current chat session
      if (!chatHistories[chatId]) {
        chatHistories[chatId] = [
          {
            role: 'system',
            content: `You are an AI tutor participating in an educational discussion. Always answer in a compact paragraph with no line breaks, no bullet points, and no numbered lists. Do not format responses with 1., 2., \n1 or anything like \n. Write naturally, using complete sentences. Also, if the chat is away from the educational discussion, you should say "I am not sure about that, but I can help you with educational questions."`,
          },
        ];
      }

      // Add the user question to the chat history
      chatHistories[chatId].push({
        role: 'user',
        content: question,
      });

      const apiKey = process.env.MISTRAL_API_KEY;

      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-tiny',
          messages: chatHistories[chatId],  // Use the specific chat history
          stream: false,  // If Mistral supports stream: true, switch this later
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botReply = response.data.choices[0].message.content;

      // Add the AI response to the chat history
      chatHistories[chatId].push({
        role: 'assistant',
        content: botReply,
      });

      // Send the bot's reply back to the client
      ws.send(JSON.stringify({ answer: botReply }));
    } catch (error) {
      console.error('Error:', error);
      ws.send(JSON.stringify({ error: 'Something went wrong' }));
    }
  });

  ws.send(JSON.stringify({ info: 'Connected to WebSocket server' }));
});

console.log('✅ WebSocket server running on ws://localhost:3001');
