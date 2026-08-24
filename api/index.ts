import express from 'express';

const app = express();
app.use(express.json());

// 1. ROUTE CHAT (Fetch direct vers l'API Gemini sans SDK fragile)
app.post('/api/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY non configurée dans Vercel.' });
    }

    const { messages, message, prompt, contents } = req.body;

    // Extrait le texte envoyé par le frontend
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

    // Appel direct à l'API REST Google Gemini (ultra stable sur Vercel)
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: userText }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur Google API:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Erreur API Google' });
    }

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse transmise par Gemini.';

    return res.json({ text: botReply });
  } catch (error: any) {
    console.error('Erreur Chat:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur interne' });
  }
});

// 2. ROUTES STUDIO (Image, Vidéo, Audio, Docs)
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
