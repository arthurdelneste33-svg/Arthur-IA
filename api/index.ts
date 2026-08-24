import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    // Récupération souple du message selon le nom du champ envoyé par le frontend
    const userMessage = req.body.message || req.body.prompt || req.body.contents || req.body.text;

    if (!userMessage) {
      return res.status(400).json({ error: 'Aucun contenu texte détecté dans la requête.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: userMessage,
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Erreur Gemini API:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur lors de la génération' });
  }
});

export default app;
