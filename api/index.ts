import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
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

  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.VITE_GEMINI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: "Clé API Gemini introuvable. Veuillez définir GEMINI_API_KEY dans les variables d'environnement Vercel." 
    });
  }

  try {
    const { 
      messages, 
      message, 
      prompt, 
      contents, 
      mode = 'normal', 
      role = 'general' 
    } = req.body || {};

    const isStreamingRequest = 
      req.url?.includes('stream') || 
      req.headers?.accept?.includes('text/event-stream') ||
      req.body?.stream === true;

    // Role prompt configuration
    let rolePrompt = "Incarne un conseiller exécutif universel, méthodique et précis.";
    if (role === 'developer') {
      rolePrompt = "Incarne un Architecte Logiciel Senior d'élite. Fournis du code TypeScript/React moderne, propre, sécurisé et typé.";
    } else if (role === 'writer') {
      rolePrompt = "Incarne un Rédacteur Stratégique et Styliste littéraire. Soigne le rythme, la précision lexicale et l'élégance du style.";
    } else if (role === 'scientist') {
      rolePrompt = "Incarne un Chercheur Scientifique et Analyste Épistémique. Démontre par la logique, cite les principes et formule des hypothèses rigoureuses.";
    }

    const systemInstruction = `Tu es « Arthur IA », une intelligence artificielle souveraine créée et développée par Arthur Delneste.
- Créateur et concepteur unique: Arthur Delneste.
- Modèle: Arthur IA 0.1 Stable Alpha.
${rolePrompt}
- Style: Réponse claire, vive, percutante, élégamment formatée en Markdown.
Réponds directement avec précision et rigueur.`;

    // Format messages for Google Gen AI
    const formattedContents: any[] = [];

    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        const parts: any[] = [];
        if (m.content) {
          parts.push({ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) });
        }
        if (Array.isArray(m.attachments)) {
          for (const att of m.attachments) {
            if (att.data) {
              const base64Clean = att.data.replace(/^data:[^;]+;base64,/, '');
              parts.push({
                inlineData: {
                  mimeType: att.type || 'image/png',
                  data: base64Clean,
                }
              });
            }
          }
        }
        if (parts.length > 0) {
          formattedContents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts,
          });
        }
      }
    } else {
      const userText = message || prompt || contents || 'Bonjour';
      formattedContents.push({
        role: 'user',
        parts: [{ text: userText }],
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = [
      'gemini-3.7-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
    ];

    if (isStreamingRequest) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const sendEvent = (obj: any) => {
        res.write(`data: ${JSON.stringify(obj)}\n\n`);
      };

      let streamed = false;
      let usedModel = 'gemini-3.7-flash';

      for (const model of candidateModels) {
        try {
          const config: any = {
            systemInstruction,
          };
          if (model === 'gemini-3.7-flash' && mode === 'advanced') {
            config.thinkingConfig = { thinkingLevel: 'HIGH' };
          } else if (model === 'gemini-3.7-flash') {
            config.thinkingConfig = { thinkingLevel: 'LOW' };
          } else if (model === 'gemini-3.1-flash-lite') {
            config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
          }

          const streamResult = await ai.models.generateContentStream({
            model,
            contents: formattedContents,
            config,
          });

          usedModel = model;
          sendEvent({ type: 'start', modelUsed: usedModel });

          let fullAccumulated = '';
          for await (const chunk of streamResult) {
            const chunkText = chunk.text || '';
            fullAccumulated += chunkText;
            sendEvent({
              type: 'text_chunk',
              chunk: chunkText,
              fullText: fullAccumulated,
            });
          }

          sendEvent({
            type: 'done',
            text: fullAccumulated,
            modelUsed: usedModel,
          });

          streamed = true;
          break;
        } catch (streamErr: any) {
          console.warn(`Vercel Stream candidate ${model} failed:`, streamErr?.message || streamErr);
        }
      }

      if (!streamed) {
        sendEvent({
          type: 'error',
          error: "Le serveur d'intelligence artificielle est momentanément saturé. Veuillez réessayer.",
        });
      }
      res.end();
      return;
    }

    // Direct JSON Response
    let finalAnswer = '';
    let usedModel = 'gemini-3.7-flash';

    for (const model of candidateModels) {
      try {
        const config: any = {
          systemInstruction,
        };
        if (model === 'gemini-3.7-flash' && mode === 'advanced') {
          config.thinkingConfig = { thinkingLevel: 'HIGH' };
        } else if (model === 'gemini-3.7-flash') {
          config.thinkingConfig = { thinkingLevel: 'LOW' };
        } else if (model === 'gemini-3.1-flash-lite') {
          config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
        }

        const result = await ai.models.generateContent({
          model,
          contents: formattedContents,
          config,
        });

        finalAnswer = result.text || '';
        usedModel = model;
        break;
      } catch (genErr: any) {
        console.warn(`Vercel Gen candidate ${model} failed:`, genErr?.message || genErr);
      }
    }

    if (!finalAnswer) {
      return res.status(503).json({
        error: "Le serveur d'intelligence artificielle connaît un pic de charge. Veuillez réessayer dans quelques instants.",
      });
    }

    return res.status(200).json({
      text: finalAnswer,
      modelUsed: usedModel,
    });
  } catch (error: any) {
    console.error('Vercel handler error:', error);
    return res.status(500).json({
      error: error.message || 'Erreur interne de traitement.',
    });
  }
}
