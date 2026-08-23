export const CHAT_SUGGESTIONS = [
  {
    icon: "Brain",
    title: "Analyse Stratégique",
    prompt: "Analyse les forces, faiblesses et opportunités de l'IA générative pour une PME européenne en 2026.",
  },
  {
    icon: "Code",
    title: "Architecture & Code",
    prompt: "Écris une fonction TypeScript robuste pour valider et formater des numéros de téléphone internationaux.",
  },
  {
    icon: "Sparkles",
    title: "Créativité & Pitch",
    prompt: "Rédige un pitch percutant de 60 secondes pour une application révolutionnant la productivité personnelle.",
  },
  {
    icon: "FileText",
    title: "Synthèse Complexe",
    prompt: "Explique le principe de fonctionnement de la mécanique quantique et de l'intrication avec une analogie simple.",
  },
];

export const MUSIC_STYLES = [
  { id: "lofi", name: "Lo-Fi Chill", icon: "Coffee", desc: "Battements doux, piano chaleureux et ambiance feutrée" },
  { id: "synthwave", name: "Cyberpunk 80s", icon: "Zap", desc: "Basses rétro analogiques et synthétiseurs néon" },
  { id: "ambient", name: "Ambient Zen", icon: "Wind", desc: "Nappes planantes pour la concentration et le sommeil" },
  { id: "orchestral", name: "Orchestre Épique", icon: "Flame", desc: "Cordes cinématiques, percussions et cuivres héroïques" },
  { id: "electronic", name: "Deep Tech", icon: "Activity", desc: "Rythmes électroniques modernes et minimalistes" },
];

export const MUSIC_PROMPTS = [
  "Musique lo-fi relaxante avec piano doux et pluie légère en arrière-plan pour étudier",
  "Synthwave cyberpunk rapide avec des arpèges néon pour une course nocturne",
  "Nappe ambiante spatiale et méditative pour relaxation profonde et concentration",
  "Musique orchestrale d'aventure avec cordes entraînantes et crescendo héroïque",
  "Acoustic chill avec guitare boisée et battement doux au coucher de soleil",
];

export const SAMPLE_MUSIC_PROMPTS = MUSIC_PROMPTS;

export const IMAGE_STYLES = [
  { id: "Photorealistic", name: "Photoréaliste 8K", desc: "Rendu photo studio ultra précis, éclairage cinématique" },
  { id: "Anime", name: "Anime Japonais", desc: "Style Makoto Shinkai, couleurs vibrantes et trait fin" },
  { id: "3D", name: "3D Render Octane", desc: "Effets volumétriques, reflets ray-tracing et textures réalistes" },
  { id: "Cyberpunk", name: "Cyberpunk Néon", desc: "Villes futuristes sombres illuminées de violet et cyan" },
  { id: "Digital Art", name: "Peinture Digitale", desc: "Texture concept art, coups de pinceau expressifs" },
  { id: "Vintage", name: "Argentique Rétro", desc: "Grain 35mm argentique, tons chauds nostalgiques" },
];

export const IMAGE_PROMPTS = [
  "Un laboratoire de recherche holographique futuriste surplombant une métropole nocturne lumineuse",
  "Un portrait cinématique d'un explorateur spatial observant une aurore cosmique sur une planète violette",
  "Une allée de cerisiers en fleurs sous une pluie de néons cyberpunk dans un Tokyo de 2080",
  "Un renard mécanique doré avec des engrenages en cristal dans une forêt enchantée",
  "Un espace de travail minimaliste et épuré avec plantes luxuriantes et lumière dorée du matin",
];

export const SAMPLE_IMAGE_PROMPTS = IMAGE_PROMPTS;
