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
    let rolePrompt = "Incarne un conseiller exécutif de haut rang, d'une acuité et d'une précision analytique exemplaires.";
    if (role === 'developer' || role === 'coder') {
      rolePrompt = "Incarne un Architecte Logiciel Principal & Ingénieur Élite. Fournis du code TypeScript/JavaScript irréprochable, moderne, modulaire, sécurisé et typé.";
    } else if (role === 'writer') {
      rolePrompt = "Incarne un Maître Styliste, Rédacteur Stratégique et Essayiste. Sublime la langue française avec une rigueur lexicale, un rythme et une élégance irréprochables.";
    } else if (role === 'scientist' || role === 'analyst') {
      rolePrompt = "Incarne un Chercheur et Analyste Stratégique Élite. Démontre par la logique, les cadres conceptuels éprouvés et une rigueur épistémique totale.";
    } else if (role === 'teacher') {
      rolePrompt = "Incarne un Professeur Universitaire & Pédagogue de Rang Supérieur. Rends limpides les concepts complexes avec des analogies vivantes et une progression méthodique.";
    }

    let systemInstruction = `Tu es « Arthur IA », intelligence artificielle souveraine de rang supérieur, conçue et développée exclusivement par **Arthur Delneste**.
- Concepteur et développeur unique : **Arthur Delneste**.
- Modèle algorithmique : **Arthur IA 0.1 Stable Alpha**.
${rolePrompt}
- Format : Rédaction en Markdown d'exception, structurée, percutante, limpide et rigoureuse.
Réponds avec une acuité intellectuelle et une pertinence maximales.`;

    if (mode === 'advanced') {
      systemInstruction = `Tu es « Arthur IA », intelligence artificielle souveraine de rang supérieur, conçue et développée exclusivement par **Arthur Delneste**.
- Modèle : **Arthur IA 0.1 Stable Alpha**.
${rolePrompt}
- Protocole de réflexion : Examine les implications logiques fondamentales, évalue les hypothèses concurrentes et structure une synthèse exécutive de haute volée.
Pour toute requête complexe, entame ta réponse par la balise <thinking>...</thinking> puis referme-la avec </thinking> avant de formuler ta synthèse finale.`;
    } else if (mode === 'fast') {
      systemInstruction = `Tu es « Arthur IA » (moteur Arthur IA 0.1 Flash Instant), créé par Arthur Delneste.
- Style : Réponse directe, ultra-rapide, concise, nette et percutante en Markdown.
${rolePrompt}`;
    }

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

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.7-flash',
    ];

    if (isStreamingRequest) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const sendEvent = (obj: any) => {
        try {
          res.write(`data: ${JSON.stringify(obj)}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        } catch (e) {
          console.warn('Vercel sendEvent error:', e);
        }
      };

      let streamed = false;
      let usedModel = 'gemini-3.1-flash-lite';

      for (const model of candidateModels) {
        let candidateDone = false;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const config: any = {
              systemInstruction,
            };
            if (model === 'gemini-3.7-flash' && mode === 'advanced') {
              config.thinkingConfig = { thinkingLevel: 'LOW' };
            } else if (model === 'gemini-flash-latest' && mode === 'advanced') {
              config.thinkingConfig = { thinkingLevel: 'LOW' };
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
            candidateDone = true;
            break;
          } catch (streamErr: any) {
            const errString = `${streamErr?.message || ''} ${streamErr?.status || ''} ${JSON.stringify(streamErr || {})}`;
            console.warn(`Vercel Stream candidate ${model} (attempt ${attempt + 1}) failed:`, streamErr?.message || streamErr);

            const isQuotaExhausted =
              errString.includes('429') ||
              errString.includes('RESOURCE_EXHAUSTED') ||
              errString.includes('Quota exceeded') ||
              errString.includes('quota') ||
              errString.includes('free_tier_requests') ||
              errString.includes('rate-limits');

            if (isQuotaExhausted) {
              break;
            }

            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        }
        if (candidateDone) break;
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
    let usedModel = 'gemini-3.1-flash-lite';

    for (const model of candidateModels) {
      try {
        const config: any = {
          systemInstruction,
        };
        if (model === 'gemini-3.7-flash' && mode === 'advanced') {
          config.thinkingConfig = { thinkingLevel: 'LOW' };
        } else if (model === 'gemini-flash-latest' && mode === 'advanced') {
          config.thinkingConfig = { thinkingLevel: 'LOW' };
        } else if (model === 'gemini-3.1-flash-lite') {
          config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
        } else if (model === 'gemini-flash-latest' && mode === 'advanced') {
          config.thinkingConfig = { thinkingLevel: 'HIGH' };
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
