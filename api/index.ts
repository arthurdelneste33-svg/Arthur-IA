import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. ROUTE CHAT
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, message, prompt, contents } = req.body;

    // Extrait le texte depuis le tableau `messages` envoyé par le frontend
    let userText = '';
    if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      userText = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
    } else {
      userText = message || prompt || contents || '';
    }

    if (!userText) {
      return res.status(400).json({ error: 'Aucun texte fourni.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: userText,
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Erreur Chat:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur Chat' });
  }
});

// 2. ROUTES DE SECOURS (Studio Images / Vidéo / Audio / Docs)
const defaultHandler = (req: any, res: any) => {
  return res.json({ 
    text: "Fonctionnalité en cours de configuration sur le serveur.",
    url: "" 
  });
};

app.post('/api/images', defaultHandler);
app.post('/api/videos', defaultHandler);
app.post('/api/audio', defaultHandler);
app.post('/api/docs', defaultHandler);

export default app;
