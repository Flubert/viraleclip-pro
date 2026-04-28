'use client';

import { useState } from 'react';
// ==================== FONCTIONS POUR SUNO ET CAPCUT ====================

const generateSunoPrompt = (analysis: any) => {
  // Priorité 1 : Paroles générées par le backend (le plus fiable)
  if (analysis?.lyrics_suno) return analysis.lyrics_suno;
  if (analysis?.analysis?.lyrics_suno) return analysis.analysis.lyrics_suno;

  // Priorité 2 : Si les paroles sont dans le main_prompt
  if (analysis?.main_prompt && analysis.main_prompt.length > 200) {
    return analysis.main_prompt;
  }

  // Fallback
  return "Aucun lyrics généré pour cette vidéo.\n\nFais une nouvelle analyse pour tenter de récupérer les vraies paroles.";
};

const generateCapCutPrompt = (analysis: any) => {
  const mainPrompt = analysis?.main_prompt || "";
  const duration = analysis?.duration_seconds || 10;

  return `Instructions détaillées et professionnelles pour monter cette vidéo dans CapCut :

• Format : Vertical 9:16
• Durée idéale : ${duration} secondes
• Rythme global : Cuts ultra-dynamiques et parfaitement synchronisés avec le beat de la musique Suno

Points clés du montage :
- Commencer par un hook fort dans les 1-2 premières secondes (zoom rapide ou effet sur le visage/expression du danseur)
- Utiliser des cuts très rythmés sur chaque mouvement fort de la chorégraphie
- Slow motion (0.3x - 0.5x) sur les meilleurs mouvements, isolations et tricks
- Transitions recommandées : Zoom rapide, Glitch, Shake, Flash, Spin, Whip pan, Light leak, Film burn
- Effets visuels :
   - Contraste élevé + couleurs vibrantes et saturées
   - Cinematic color grading (teinte légèrement teal/orange ou cold tone selon l’ambiance)
   - Légers film grain + vignette subtile
   - Motion blur sur les mouvements rapides
- Textes : Courts, stylés, qui apparaissent et disparaissent en rythme (police moderne, animation pop)
- Synchronisation musique : Tous les cuts et effets doivent tomber pile sur les temps forts du morceau Suno

Style global : Qualité professionnelle TikTok/Reels, énergie maximale, moderne, cinématographique et hautement viral.

Priorité : Mettre en valeur la chorégraphie, la précision des mouvements, le charisme du danseur et l’énergie de la vidéo.`;
};
export default function ViraleClipPro() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const analyzeVideo = async () => {
    if (!url.trim()) {
      setError('Veuillez coller un lien vidéo');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

  if (data.success) {
  const analysis = data.analysis || {};

  const sunoPrompt = generateSunoPrompt(analysis);
  const capcutPrompt = generateCapCutPrompt(analysis);

  const completeResult = {
  ...data,
  analysis,                    // Garde l'analyse complète
  sunoPrompt,                  // ← Note le "S" majuscule
  capcutPrompt,                // ← Note le "C" majuscule
  videoUrl: url
};

  setResult(completeResult);
} else {
  setError(data.error || 'Erreur lors de l’analyse');
}
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`✅ ${label} copié !`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-6">
          ViraleClip <span className="text-cyan-400">Pro</span>
        </h1>
        <p className="text-center text-zinc-400 mb-12 text-xl">
          Colle un lien → Analyse avec Gemini → Prompt prêt pour Kling / Sora / Veo 3
        </p>
<div className="flex gap-3">
  {/* Champ URL */}
  <input
    type="text"
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    placeholder="https://www.youtube.com/shorts/..."
    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
  />

  {/* Bouton Analyser */}
  <button 
    onClick={analyzeVideo}
    disabled={loading}
    className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
  >
    Analyser
  </button>

  {/* Bouton Nouvelle Analyse */}
 <button 

  onClick={() => {
    setUrl('');
    setResult(null);
    setError('');
  }}
  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
>
  Nouvelle Analyse
</button>
</div>
        {error && <div className="text-red-400 text-center mb-8">{error}</div>}

{/* Résultats */}
       {/* ==================== SECTION RÉSULTATS ==================== */}
{result && (
  <div className="mt-10 space-y-8 max-w-4xl mx-auto">

    {/* Prompt Principal */}
    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-cyan-400">Prompt Principal (Kling / Sora / Veo 3)</h2>
        <button 
          onClick={() => copyToClipboard(result.analysis?.main_prompt || '', "Prompt Principal")}
          className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          📋 Copier
        </button>
      </div>
      <pre className="bg-black p-6 rounded-2xl text-sm text-white whitespace-pre-wrap overflow-auto max-h-96">
        {result.analysis?.main_prompt || "Aucun prompt disponible"}
      </pre>
    </div>
    {/* Invite Suno */}
    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎵</span>
          <h2 className="text-2xl font-semibold">Invite Suno</h2>
        </div>
        <button 
          onClick={() => copyToClipboard(result.sunoPrompt || '', "Invite Suno")}
          className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          📋 Copier
        </button>
      </div>
      <div className="bg-black p-6 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed font-mono">
        {result.sunoPrompt || "Aucun lyrics généré pour cette vidéo.\n\nFais une nouvelle analyse."}
      </div>
    </div>

    {/* Instructions CapCut */}
    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✂️</span>
          <h2 className="text-2xl font-semibold">Instructions CapCut</h2>
        </div>
        <button 
          onClick={() => copyToClipboard(result.capcutPrompt || '', "Instructions CapCut")}
          className="bg-zinc-800 hover:bg-zinc-700 px-5 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          📋 Copier
        </button>
      </div>
      <div className="bg-black p-6 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed">
        {result.capcutPrompt || "Aucune instruction CapCut générée"}
      </div>
    </div>

    {/* Bouton Télécharger la vidéo originale */}
    <div className="flex justify-center pt-8 pb-6">
      <a 
        href={result.videoUrl} 
        download 
        className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-700 rounded-3xl text-white font-medium transition-all hover:scale-105 shadow-lg"
      >
        ⬇️ Télécharger la vidéo originale
      </a>
    </div>

  </div>
)}
      </div>
    </div>
  );
}