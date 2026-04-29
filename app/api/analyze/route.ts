import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    console.log(`📥 Traitement du lien : ${url}`);
// Création robuste du dossier temp (compatible Vercel Serverless)
const tempDir = path.join(process.cwd(), 'temp');
try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
} catch (err: any) {
  console.error("Erreur lors de la création du dossier temp:", err.message);
}
    const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);

    // Stratégies de téléchargement
    const cookiesPath = path.join(process.cwd(), 'cookies.txt');
    const hasCookies = fs.existsSync(cookiesPath);

    const strategies = [
      hasCookies ? `yt-dlp --cookies "${cookiesPath}" --no-warnings --no-playlist --max-filesize 200M -f "best[height<=720]/best" -o "${videoPath}" "${url}"` : '',
      `yt-dlp --cookies-from-browser chrome --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --extractor-args "youtube:player_client=android,web" --no-warnings --no-playlist --max-filesize 200M -f "best[height<=720]/best" -o "${videoPath}" "${url}"`,
      `yt-dlp --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" --extractor-args "youtube:player_client=android,web" --no-warnings --no-playlist --max-filesize 250M -o "${videoPath}" "${url}"`
    ].filter(Boolean);

    let success = false;

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Tentative de téléchargement ${i + 1}/3...`);
        execSync(strategies[i], { stdio: 'inherit', encoding: 'utf8' });

        if (fs.existsSync(videoPath)) {
          success = true;
          console.log("✅ Téléchargement réussi !");
          break;
        }
      } catch (e) {
        console.log(`Tentative ${i + 1} échouée.`);
      }
    }

    if (!success || !fs.existsSync(videoPath)) {
      throw new Error(
        hasCookies
          ? "Impossible de télécharger la vidéo. Vos cookies YouTube sont peut-être expirés. Essayez de réexporter cookies.txt."
          : "Impossible de télécharger la vidéo. Essayez d'exporter vos cookies YouTube dans un fichier cookies.txt à la racine du projet."
      );
    }

    const videoBuffer = fs.readFileSync(videoPath);
    console.log(`📤 Vidéo prête (${(videoBuffer.length / 1024 / 1024).toFixed(1)} MB) - Analyse Gemini...`);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",   // Plus léger et souvent plus rapide
  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 8192
  }
});
 const promptAnalysis = `Tu es un expert mondial en prompt engineering pour IA vidéo (Kling 3.0, Google Veo 3.1, OpenAI Sora 2) et en écriture de paroles.

Analyse cette vidéo virale avec une précision extrême, en mettant l'accent sur la chorégraphie et les mouvements du danseur.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte :

{
  "main_prompt": "Prompt ultra-détaillé en anglais, très cinématographique, optimisé pour Kling / Veo 3 / Sora. Décris avec une extrême précision : la chorégraphie complète, les mouvements de corps (isolations, waves, glides, pops, locks, footwork), les gestes des mains, les expressions faciales, le flow, le rythme, l'énergie, le style de danse, les interactions avec la caméra et l'environnement.",
  "negative_prompt": "flou, déformation, mauvais anatomie, texte incrusté, logo, watermark, tremblement, artefacts, mouvements saccadés",
  "duration_seconds": nombre entier,
  "aspect_ratio": "9:16",
  "camera_movement": "description précise des mouvements de caméra (tracking shot, close-up sur les mains/pieds, low angle, etc.)",
  "motion_intensity": "low | medium | high | dynamic",
  "style": "style visuel",
  "lighting": "description de l'éclairage",
  "subject_details": "description ultra-précise du danseur : âge, tenue exacte, style de danse, mouvements signature, expressions, charisme, énergie",
  "environment": "description détaillée du décor et de l'ambiance",
  "lyrics_suno": "Écris les vraies paroles de la chanson présentes dans la vidéo (transcription fidèle). Structure claire avec [Intro], [Couplet 1], [Pré-refrain], [Refrain], etc."
}

Sois extrêmement précis sur les mouvements de danse, le timing, les isolations, les expressions et l'énergie pour maximiser la similarité avec la vidéo originale.
Priorise un prompt qui fonctionne très bien sur Kling 3.0 et Veo 3.1.`;

   // ==================== APPEL GEMINI AVEC RETRY AUTOMATIQUE ====================
let result;
let lastError;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`🔄 Tentative Gemini ${attempt}/3...`);

    result = await model.generateContent([
      promptAnalysis,
      { 
        inlineData: { 
          data: videoBuffer.toString('base64'), 
          mimeType: 'video/mp4' 
        } 
      }
    ]);

    console.log(`✅ Analyse Gemini réussie (tentative ${attempt})`);
    break; // Succès

  } catch (error: any) {
    lastError = error;
    console.log(`❌ Tentative ${attempt} échouée: ${error.message}`);

    if (attempt === 3) break;

   

const waitTime = attempt * 4000;   // → change en 3000 ou 2000
    console.log(`⏳ Attente ${waitTime/1000}s avant nouvelle tentative...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

if (!result) {
  throw new Error(`Gemini a échoué après 3 tentatives : ${lastError?.message}`);
}

    const responseText = result.response.text();
    let analysis;
    try {
      const match = responseText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(match ? match[0] : responseText);
    } catch {
      analysis = { main_prompt: responseText };
    }

    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);

    return NextResponse.json({ success: true, analysis });

  } catch (error: any) {
    console.error("Erreur :", error.message);

    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
