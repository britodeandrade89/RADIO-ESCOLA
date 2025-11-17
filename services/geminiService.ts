
import { GoogleGenAI, Modality } from "@google/genai";
import type { Song, VoiceOption } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generatePrompt = (currentSong: Song | null, nextSong: Song | null): string => {
  if (!currentSong) {
    return "Você é um DJ de rádio animado na 'RÁDIO ESCOLA JOANA'. Dê as boas-vindas aos ouvintes e diga-lhes para se prepararem para uma ótima música. Mantenha a mensagem curta e animada, com menos de 30 palavras.";
  }
  if (!nextSong) {
    return `Você é um DJ de rádio animado na 'RÁDIO ESCOLA JOANA'. A música que acabou de tocar foi "${currentSong.name}" por ${currentSong.artist}. Agradeça aos ouvintes por sintonizarem. Mantenha a mensagem curta e animada, com menos de 30 palavras.`;
  }
  return `Você é um DJ de rádio animado na 'RÁDIO ESCOLA JOANA'. A música que acabou de tocar foi "${currentSong.name}" e a próxima será "${nextSong.name}". Crie uma transição curta e emocionante entre as duas. Mantenha a mensagem curta e animada, com menos de 30 palavras.`;
};

export const generateDjBanter = async (currentSong: Song | null, nextSong: Song | null): Promise<string> => {
  const prompt = generatePrompt(currentSong, nextSong);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating DJ banter:", error);
    return "Ocorreu um erro ao tentar gerar o texto. Tente novamente.";
  }
};

export const generateDjSpeech = async (currentSong: Song | null, nextSong: Song | null, voice: VoiceOption): Promise<string | null> => {
    const textToSpeak = await generateDjBanter(currentSong, nextSong);

    if (textToSpeak.includes("Ocorreu um erro")) {
        return null;
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return `data:audio/mpeg;base64,${base64Audio}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating DJ speech:", error);
        return null;
    }
};
