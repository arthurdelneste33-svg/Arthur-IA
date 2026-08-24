import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Gestion CORS (autorise l'interface React à appeler l'API)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY non configurée sur Vercel.' });
    }

    const { messages, message, prompt, contents } = req.body || {};

    // Extrait le texte peu importe le format envoyé par le client React
    let userText = '';
    if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      userText = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content);
    } else {
      userText = message || prompt || contents || '';
    }

    if (!userText) {
      return res.status(400).json({ error: 'Aucun texte fourni dans la requête.' });
    }

    // Appel direct ultra-stable à l'API REST Google Gemini
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
      return res.status(response.status).json({ error: data.error?.message || 'Erreur Gemini' });
    }

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse transmise.';

    return res.status(200).json({ text: botReply });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur serveur interne' });
  }
}
