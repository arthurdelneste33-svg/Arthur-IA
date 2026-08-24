import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

// Initialisation du client Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Le message est requis.' });
    }

    // Utilisation d'un modèle officiel valide
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: message,
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Erreur Gemini API:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur lors de la génération' });
  }
});

export default app;
