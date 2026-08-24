import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;
    const modelName = model || 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: message,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

export default app;
