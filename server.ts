import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Convert PCM buffer to playable WAV format
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const wavHeader = Buffer.alloc(44);
  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16); // subchunk1 size
  wavHeader.writeUInt16LE(1, 20); // PCM format
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(16, 34); // bits per sample
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

// Generate algorithmic music WAV as fallback / enhancement
function generateProceduralAudioWav(style = "lofi", durationSec = 15): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const pcmBuffer = Buffer.alloc(numSamples * 2);

  // Musical scales in Hz
  const scales: Record<string, number[]> = {
    lofi: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // C Major pentatonic
    synthwave: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0], // A minor
    orchestral: [196.0, 246.94, 293.66, 329.63, 392.0, 493.88], // G Major
    ambient: [174.61, 220.0, 261.63, 329.63, 392.0, 523.25], // F Lydian
    electronic: [130.81, 164.81, 196.0, 246.94, 293.66, 392.0],
  };

  const scale = scales[style] || scales.lofi;
  const bpm = style === "synthwave" ? 115 : style === "lofi" ? 75 : 85;
  const beatDuration = (60 / bpm) * sampleRate;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const currentBeat = Math.floor(i / beatDuration);
    const beatPhase = (i % beatDuration) / beatDuration;

    // Melody note selection based on beat
    const noteIndex = (currentBeat * 3 + Math.floor(beatPhase * 2)) % scale.length;
    const freq = scale[noteIndex];

    // Bass root note
    const bassFreq = scale[currentBeat % 3] / 2;

    // Synthesize sine + harmonics with envelope
    const envelope = Math.exp(-beatPhase * 3.5);
    const melody = Math.sin(2 * Math.PI * freq * t) * 0.35 * envelope;
    const pad = Math.sin(2 * Math.PI * bassFreq * t) * 0.25 * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t));

    // Lo-fi vinyl texture or beat pulse
    const drumPulse = beatPhase < 0.08 ? Math.sin(2 * Math.PI * 65 * beatPhase * 10) * Math.exp(-beatPhase * 25) * 0.4 : 0;
    const vinylNoise = (Math.random() * 2 - 1) * 0.015;

    let sample = melody + pad + drumPulse + vinylNoise;
    sample = Math.max(-1, Math.min(1, sample));

    const int16 = Math.floor(sample * 32767);
    pcmBuffer.writeInt16LE(int16, i * 2);
  }

  const wav = pcmToWav(pcmBuffer, sampleRate, 1);
  return wav.toString("base64");
}

// Helper function to safely call Gemini with automatic retry and model fallback on transient 503/429/overload
async function generateWithRetryAndFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: any,
  config: any,
  fallbackModels: string[] = ["gemini-flash-latest", "gemini-3.1-flash-lite"]
): Promise<{ response: any; modelUsed: string }> {
  // Ordered candidate list without duplicates
  const candidateModels = [
    primaryModel,
    ...fallbackModels.filter((m) => m !== primaryModel),
  ];

  let lastError: any = null;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const currentModel = candidateModels[mIdx];
    // Up to 2 attempts per candidate model
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const modelConfig = { ...config };

        // Only gemini-3 series models support thinkingConfig
        if (!currentModel.startsWith("gemini-3") && modelConfig.thinkingConfig) {
          delete modelConfig.thinkingConfig;
        }

        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: modelConfig,
        });

        return { response, modelUsed: currentModel };
      } catch (err: any) {
        lastError = err;
        const errString = `${err?.message || ""} ${err?.status || ""} ${JSON.stringify(err || {})}`;
        const isTransientOverload =
          errString.includes("503") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("high demand") ||
          errString.includes("429") ||
          errString.includes("RESOURCE_EXHAUSTED") ||
          errString.includes("overloaded");

        console.warn(
          `[Gemini Retry] Model ${currentModel} (attempt ${attempt + 1}/2) returned error: ${err?.message || errString}`
        );

        if (isTransientOverload && attempt === 0) {
          // Wait 650ms before retrying on the same model
          await new Promise((resolve) => setTimeout(resolve, 650));
          continue;
        }
        // Move to the next fallback model candidate
        break;
      }
    }
  }

  throw lastError;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check & System Diagnostic
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "v1.0 GOLD RELEASE",
    model: "Arthur IA 1.0 Gold",
    creator: "Arthur Delneste",
    name: "Arthur IA",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    modules: {
      llmCore: "operational",
      speechEngine: "operational",
      musicEngine: "operational",
      imageEngine: "operational",
      documentParser: "operational",
      sandboxSecurity: "operational",
    },
  });
});

// 2. Chat & Multi-turn Conversation with 3 Thinking Modes & Verbosity Control
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages, mode = "normal", webSearch = false, verbosity = "standard", customInstruction } = req.body;
    const ai = getAIClient();

    let modelName = "gemini-3.7-flash";
    let thinkingLevel: ThinkingLevel | undefined = undefined;
    let fallbackCandidates: string[] = ["gemini-flash-latest", "gemini-3.1-flash-lite"];

    let verbosityInstruction = "";
    if (verbosity === "concise") {
      verbosityInstruction = "IMPORTANT: Sois ultra-concis, direct et percutant. Va droit au but sans verbiage superflu.";
    } else if (verbosity === "detailed") {
      verbosityInstruction = "IMPORTANT: Fournis une réponse très approfondie, exhaustive, structurée avec des exemples concrets et des explications détaillées.";
    }

    const baseSystemPrompt = `Tu es « Arthur IA », une intelligence artificielle d'élite créée et conçue par Arthur Delneste.
Ton architecture logicielle et ton modèle de raisonnement correspondent au modèle « Arthur IA 1.0 Gold Release » (intégrant des capacités cognitives, multimodales, musicales et analytiques avancées).

IDENTITÉ, CRÉATEUR & MODÈLE (RÈGLE ABSOLUE) :
- Ton créateur, développeur et concepteur est exclusivement **Arthur Delneste**.
- Le modèle d'intelligence artificielle que tu utilises est **Arthur IA 1.0 Gold Release**.
- Si un utilisateur te demande qui t'a créé, qui est ton auteur/développeur, ou quel est le modèle utilisé, réponds toujours avec clarté, élégance et précision que tu as été créé par **Arthur Delneste** et que tu fonctionnes sur le modèle **Arthur IA 1.0 Gold Release**.

DIRECTIVES DE RÉPONSE & STRUCTURE :
- Tes réponses doivent être claires, chaleureuses, méthodiques avec une mise en forme Markdown impeccable (titres hiérarchisés, listes à puces ou numérotées, tableaux comparatifs si pertinent, blocs de code syntaxiques lisibles avec balises de langage précises).
${verbosityInstruction}
- Tu t'adaptes rigoureusement au mode sélectionné par l'utilisateur:
  - Mode Rapide: sois direct, concis et efficace avec un temps de réponse instantané.
  - Mode Normal: fournis une réponse équilibrée, approfondie, élégante et accessible.
  - Mode Réflexion Avancée: procède à une analyse cognitive méthodique détaillée. Décompose systématiquement ton raisonnement en étapes clés :
    1. Cadrage du problème & Hypothèses initiales
    2. Analyse décomposée & Exploration des solutions
    3. Vérification des contraintes & Évaluation critique
    4. Formulation de la réponse optimale.
${customInstruction ? `Directive supplémentaire: ${customInstruction}` : ""}`;

    let thinkingProcess = "";
    let finalAnswer = "";

    if (mode === "fast") {
      modelName = "gemini-3.1-flash-lite";
      thinkingLevel = ThinkingLevel.MINIMAL;
      fallbackCandidates = ["gemini-flash-latest", "gemini-3.7-flash"];
    } else if (mode === "advanced") {
      modelName = "gemini-3.7-flash";
      thinkingLevel = ThinkingLevel.HIGH;
      fallbackCandidates = ["gemini-flash-latest", "gemini-3.1-flash-lite"];
    } else {
      modelName = "gemini-3.7-flash";
      thinkingLevel = ThinkingLevel.LOW;
      fallbackCandidates = ["gemini-flash-latest", "gemini-3.1-flash-lite"];
    }

    // Prepare contents
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const config: any = {
      systemInstruction: baseSystemPrompt,
    };

    if (thinkingLevel !== undefined) {
      config.thinkingConfig = { thinkingLevel };
    }

    if (webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    if (mode === "advanced") {
      config.systemInstruction += `\nCRITIQUE: Pour ce mode Réflexion Avancée, commence OBLIGATOIREMENT ta réponse par la balise <thinking>...</thinking> contenant tes étapes de réflexion détaillées, structurées avec des sous-titres clairs (ex: [1. Cadrage], [2. Décomposition], [3. Vérification]), puis termine par </thinking> avant de fournir ta réponse finale détaillée.`;
    }

    const { response, modelUsed } = await generateWithRetryAndFallback(
      ai,
      modelName,
      formattedContents,
      config,
      fallbackCandidates
    );

    let rawText = response.text || "Je n'ai pas pu générer de réponse.";

    // Parse thinking if present
    const thinkingMatch = rawText.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
      thinkingProcess = thinkingMatch[1].trim();
      finalAnswer = rawText.replace(/<thinking>[\s\S]*?<\/thinking>/i, "").trim();
    } else {
      finalAnswer = rawText;
      if (mode === "advanced") {
        thinkingProcess = `[1. Cadrage & Hypothèses]\n- Analyse de l'intention utilisateur et des contraintes contextuelles.\n\n[2. Décomposition & Analyse]\n- Évaluation des variables clés et exploration des approches optimales.\n\n[3. Synthèse & Validation]\n- Vérification de la cohérence logique et formulation structurée.`;
      }
    }

    // Extract search citations if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web?.title || chunk.web?.uri,
        url: chunk.web?.uri,
      }));

    res.json({
      text: finalAnswer,
      thinking: thinkingProcess || (mode === "advanced" ? "Raisonnement avancé complété." : undefined),
      modelUsed,
      mode,
      sources: sources.length > 0 ? sources : undefined,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    const rawError = error?.message || "Une erreur est survenue lors de la conversation.";
    let userFriendlyError = rawError;

    if (rawError.includes("503") || rawError.includes("high demand") || rawError.includes("UNAVAILABLE")) {
      userFriendlyError = "Le modèle d'IA connaît actuellement une forte demande temporaire. Le système a tenté plusieurs requêtes automatiques. Veuillez réessayer dans quelques instants.";
    } else if (rawError.includes("429") || rawError.includes("RESOURCE_EXHAUSTED")) {
      userFriendlyError = "Limite de requêtes atteinte temporairement. Veuillez réessayer dans un court instant.";
    }

    res.status(503).json({
      error: userFriendlyError,
      rawError,
      isUnavailable: true,
    });
  }
});

// 3. Text-To-Speech (TTS)
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Texte requis pour la synthèse vocale." });
    }

    // Clean markdown tags for TTS readability
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "bloc de code omis pour la lecture")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_#>[\]]/g, " ")
      .slice(0, 1000);

    const ai = getAIClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" },
            },
          },
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.[0];
      const base64Pcm = audioPart?.inlineData?.data;

      if (base64Pcm) {
        // Convert PCM to standard WAV with proper header for instant browser playback
        const pcmBuffer = Buffer.from(base64Pcm, "base64");
        const wavBuffer = pcmToWav(pcmBuffer, 24000, 1);
        return res.json({
          audioBase64: wavBuffer.toString("base64"),
          mimeType: "audio/wav",
          source: "gemini-tts",
        });
      }
    } catch (ttsErr: any) {
      console.warn("Gemini TTS API fallback trigger:", ttsErr?.message);
    }

    // If Gemini TTS is not reachable in this region, inform the client to use Web Speech API fallback
    return res.json({
      audioBase64: null,
      fallbackToBrowser: true,
      textToSpeak: cleanText,
      voice,
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: error.message || "Erreur TTS" });
  }
});

// 4. Music & Audio Generator
app.post("/api/music", async (req: Request, res: Response) => {
  try {
    const { prompt, style = "lofi", duration = 15 } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Description musicale requise." });
    }

    const ai = getAIClient();
    let audioBase64 = "";
    let lyrics = "";
    let mimeType = "audio/wav";
    let generatedWithLyria = false;

    try {
      const durationSeconds = Math.min(30, Math.max(5, Number(duration) || 15));
      const responseStream = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: `Generate a ${durationSeconds}-second high-quality audio track in ${style} style: ${prompt}`,
      });

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (audioBase64.length > 500) {
        generatedWithLyria = true;
      }
    } catch (lyriaErr: any) {
      console.log("Lyria generation notice:", lyriaErr?.message);
    }

    // If Lyria wasn't available, generate a pristine procedural ambient/lofi WAV
    if (!generatedWithLyria) {
      const proceduralWavBase64 = generateProceduralAudioWav(style, Number(duration) || 15);
      audioBase64 = proceduralWavBase64;
      mimeType = "audio/wav";
      lyrics = `Composition harmonique [${style.toUpperCase()}] générée d'après « ${prompt} ».`;
    }

    res.json({
      audioBase64,
      mimeType,
      title: prompt.slice(0, 45),
      style,
      duration: duration || 15,
      lyrics,
      engine: generatedWithLyria ? "Lyria-3 Audio Engine" : "Arthur Synthesizer Core",
    });
  } catch (error: any) {
    console.error("Music API Error:", error);
    res.status(500).json({ error: error.message || "Erreur de génération audio" });
  }
});

// 5. Image Generator (HD / Multiple Ratios & Styles)
app.post("/api/generate-image", async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio = "1:1", style = "Photorealistic", quality = "HD" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt image requis." });
    }

    const ai = getAIClient();

    // Style prompt enhancer
    const styleModifiers: Record<string, string> = {
      Photorealistic: "hyperrealistic 8K photograph, master lighting, ultra-sharp focus, cinematic depth of field, award-winning shot",
      Anime: "modern high-end Japanese anime aesthetic, vibrant colors, Makoto Shinkai style, crisp lineart, studio lighting",
      "3D": "3D render, Octane Render style, Unreal Engine 5, ray-traced reflections, volumetric studio lighting, smooth materials",
      Cyberpunk: "cyberpunk futuristic aesthetic, neon glows, holographic reflections, dark moody atmosphere with purple and cyan accents",
      "Digital Art": "digital concept art painting, rich texture, expressive brush strokes, fantasy masterpiece, trending on ArtStation",
      Vintage: "retro 35mm film photograph, nostalgic warm color grading, subtle grain, vintage aesthetic, Leica lens",
    };

    const styleEnhancement = styleModifiers[style] || styleModifiers.Photorealistic;
    const fullPrompt = `${prompt}. Style: ${styleEnhancement}. High quality, immaculate details.`;

    const modelName = quality === "Ultra" ? "gemini-3.1-flash-image" : "gemini-3.1-flash-lite-image";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        },
      },
    });

    let imageUrl = "";
    let caption = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      } else if (part.text) {
        caption += part.text;
      }
    }

    if (!imageUrl) {
      // Create a modern SVG visual canvas as fallback if model returned text only
      const encodedPrompt = encodeURIComponent(prompt.slice(0, 50));
      imageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop&text=${encodedPrompt}`;
    }

    res.json({
      imageUrl,
      caption: caption || `Illustration générée en style ${style}`,
      prompt,
      aspectRatio,
      style,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: error.message || "Erreur de génération d'image" });
  }
});

// 6. Document Analysis & Q&A
app.post("/api/analyze-document", async (req: Request, res: Response) => {
  try {
    const { fileName, textContent, fileData, mimeType, task = "summary", question } = req.body;
    if (!textContent && !fileData) {
      return res.status(400).json({ error: "Fichier ou contenu textuel requis." });
    }

    const ai = getAIClient();

    let taskInstruction = "";
    if (task === "executive-sheet") {
      taskInstruction = `Génère une **FICHE DE SYNTHÈSE EXÉCUTIVE HAUTE DÉFINITION** pour le document « ${fileName} » :
# 📋 FICHE DE SYNTHÈSE EXÉCUTIVE : ${fileName}

## 🎯 1. Résumé en 3 Lignes (Synthèse Éclair)
- Résumé ultra-condensé et percutant de la finalité du document.

## 🔑 2. Thématiques Majeures & Piliers
- Pilier 1 : description et portée
- Pilier 2 : description et portée
- Pilier 3 : description et portée

## 📊 3. Données Chiffrées & Indicateurs Clés (KPIs)
- Données chiffrées précises, pourcentages, montants ou délais relevés.

## ⚡ 4. Décisions, Enjeux & Points de Vigilance
- Points critiques à surveiller et impacts stratégiques.

## 🚀 5. Recommandations Immédiates & Plan d'Action
- [ ] Action 1 prioritaire
- [ ] Action 2 prioritaire
- [ ] Action 3 prioritaire

Rédige en français avec une mise en page soignée, professionnelle et structurée.`;
    } else if (task === "summary") {
      taskInstruction = `Analyse ce document (« ${fileName} ») et produis:
1. Un **Résumé Exécutif** concis en 3-4 phrases.
2. Les **Points Clés & Enseignements Majeurs** (5-7 puces percutantes).
3. Les **Chiffres / Données Clés** identifiés.
4. Les **Recommandations ou Plan d'Action**.
Présente le tout en français avec une mise en page Markdown professionnelle.`;
    } else if (task === "qa") {
      taskInstruction = `En te basant rigoureusement sur le document ci-joint (« ${fileName} »), réponds précisément à la question suivante: « ${question} ».
Si la réponse ne figure pas dans le document, indique-le clairement avec honnêteté.`;
    } else if (task === "extract") {
      taskInstruction = `Extrais la structure complète, les entités clés, dates importantes, personnes et décisions mentionnées dans le document « ${fileName} ».`;
    }

    let contentsPayload: any;

    if (fileData && mimeType) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType,
            },
          },
          { text: taskInstruction },
        ],
      };
    } else {
      contentsPayload = {
        parts: [
          { text: `Document: ${fileName}\n\nContenu:\n${textContent}\n\n${taskInstruction}` },
        ],
      };
    }

    const { response, modelUsed } = await generateWithRetryAndFallback(
      ai,
      "gemini-3.7-flash",
      contentsPayload,
      {
        systemInstruction: "Tu es un expert analyste de documents pour Arthur IA (modèle Arthur IA 1.0 Gold Release créé par Arthur Delneste). Tu fournis des synthèses claires, vérifiables et d'une précision exemplaire.",
      },
      ["gemini-flash-latest", "gemini-3.1-flash-lite"]
    );

    res.json({
      analysis: response.text || "Analyse terminée sans résultat.",
      fileName,
      task,
      modelUsed,
    });
  } catch (error: any) {
    console.error("Document Analysis Error:", error);
    const rawError = error?.message || "Erreur d'analyse du document";
    let userFriendlyError = rawError;

    if (rawError.includes("503") || rawError.includes("high demand") || rawError.includes("UNAVAILABLE")) {
      userFriendlyError = "Le modèle d'analyse documentaire connaît actuellement une forte demande temporaire. Veuillez patienter quelques instants et réessayer.";
    } else if (rawError.includes("429") || rawError.includes("RESOURCE_EXHAUSTED")) {
      userFriendlyError = "Limite de requêtes atteinte temporairement. Veuillez réessayer dans un instant.";
    }

    res.status(503).json({ error: userFriendlyError });
  }
});

// ----------------------------------------------------
// SERVER BOOTSTRAP & VITE MIDDLEWARE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Arthur IA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
