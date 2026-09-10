// Devotional & Theological Audio Engine: Voz Humanizada, Expressiva e Fundo Harmônico Celestial
// Baseado no Perfil Vocal: Voz Masculina Madura e Profunda (50-65 anos, calorosa, experiente, autoridade acolhedora)

export type VoiceArchetype = 'maduro' | 'solene' | 'suave' | 'feminina';

export interface VoiceProfileConfig {
  name: string;
  description: string;
  rate: number;
  pitch: number;
  geminiVoice: 'Charon' | 'Fenrir' | 'Kore' | 'Puck';
}

export const VOICE_PROFILES: Record<VoiceArchetype, VoiceProfileConfig> = {
  maduro: {
    name: 'Voz Madura & Humana (50-65a)',
    description: 'Grave, calorosa, experiente e expressiva com pausas naturais',
    rate: 0.90,
    pitch: 0.78,
    geminiVoice: 'Charon'
  },
  solene: {
    name: 'Solene & Profunda',
    description: 'Tom reverente e imponente estilo narração bíblica sagrada',
    rate: 0.85,
    pitch: 0.75,
    geminiVoice: 'Fenrir'
  },
  suave: {
    name: 'Suave & Acolhedora',
    description: 'Paz, conforto espiritual e meditação devocional',
    rate: 0.90,
    pitch: 0.92,
    geminiVoice: 'Puck'
  },
  feminina: {
    name: 'Serena Feminina',
    description: 'Voz doce, clara e acolhedora para reflexão',
    rate: 0.92,
    pitch: 1.05,
    geminiVoice: 'Kore'
  }
};

class DevotionalAudioEngine {
  private audioCtx: AudioContext | null = null;
  private backgroundGainNode: GainNode | null = null;
  private isBackgroundPlaying = false;
  private bgOscillators: OscillatorNode[] = [];
  private bgInterval: number | null = null;

  private isSpeechPlaying = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private onVerseChangeCallback: ((verseNum: number) => void) | null = null;
  private onStateChangeCallback: ((isPlaying: boolean) => void) | null = null;

  // Settings
  public voiceArchetype: VoiceArchetype = 'maduro';
  public voiceVolume = 1.0;
  public musicVolume = 0.25;
  public speechRate = 0.90; // Humanized conversational pacing ~0.92x
  public speechPitch = 0.78; // Low-pitched, mature 50-65yo male timbre

  constructor() {
    // Load saved preferences
    const savedVoice = localStorage.getItem('devotional_voice_archetype') as VoiceArchetype;
    if (savedVoice && ['maduro', 'solene', 'suave', 'feminina'].includes(savedVoice)) {
      this.voiceArchetype = savedVoice;
    } else {
      this.voiceArchetype = 'maduro';
    }

    const savedMusicVol = localStorage.getItem('devotional_music_volume');
    if (savedMusicVol) this.musicVolume = parseFloat(savedMusicVol);
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Warm, peaceful, heavenly ambient synth pad (D Major / G Major worship progression)
  public startAmbientPad() {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      if (this.isBackgroundPlaying) return;
      this.isBackgroundPlaying = true;

      const ctx = this.audioCtx;

      // Master Gain for background ambient music
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(this.musicVolume * 0.35, ctx.currentTime + 2.5);
      this.backgroundGainNode = masterGain;

      // Low pass filter for soft, warm tone (no harsh highs)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, ctx.currentTime);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Chords to cycle through (peaceful worship progression: D major, G major, B minor, A major)
      const chords = [
        [146.83, 220.00, 293.66, 369.99], // D3, A3, D4, F#4
        [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4
        [123.47, 185.00, 246.94, 293.66], // B2, F#3, B3, D4
        [220.00, 277.18, 329.63, 440.00], // A3, C#4, E4, A4
      ];

      let chordIndex = 0;

      const playChord = () => {
        if (!this.isBackgroundPlaying || !this.audioCtx) return;

        // Clean up previous chord oscillators
        this.bgOscillators.forEach(osc => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        this.bgOscillators = [];

        const currentChord = chords[chordIndex];
        chordIndex = (chordIndex + 1) % chords.length;

        currentChord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq + (Math.random() * 0.3 - 0.15), ctx.currentTime);

          // Gentle fade in & fade out
          const now = ctx.currentTime;
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.linearRampToValueAtTime(0.07 / currentChord.length, now + 2);
          oscGain.gain.linearRampToValueAtTime(0.035 / currentChord.length, now + 7);
          oscGain.gain.linearRampToValueAtTime(0, now + 9.8);

          osc.connect(oscGain);
          oscGain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 10);
          this.bgOscillators.push(osc);
        });
      };

      playChord();
      this.bgInterval = window.setInterval(playChord, 9500);
    } catch (err) {
      console.warn('Failed to start ambient pad:', err);
    }
  }

  public stopAmbientPad() {
    this.isBackgroundPlaying = false;
    if (this.bgInterval) {
      clearInterval(this.bgInterval);
      this.bgInterval = null;
    }
    if (this.backgroundGainNode && this.audioCtx) {
      try {
        this.backgroundGainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.2);
      } catch {}
    }
    this.bgOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.bgOscillators = [];
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = vol;
    localStorage.setItem('devotional_music_volume', vol.toString());
    if (this.backgroundGainNode && this.audioCtx) {
      try {
        this.backgroundGainNode.gain.linearRampToValueAtTime(vol * 0.35, this.audioCtx.currentTime + 0.3);
      } catch {}
    }
  }

  // Pre-process text to insert natural human breathing pauses, cadence and prosody
  public humanizeTextForSpeech(text: string): string {
    let clean = text
      .replace(/#+\s/g, '')
      .replace(/[*_`]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[-*•]\s+/g, '')
      .trim();

    // Expand common abbreviations for natural, dignified Portuguese speech
    clean = clean
      .replace(/\bSl\b\.?/gi, 'Salmos')
      .replace(/\bMt\b\.?/gi, 'Mateus')
      .replace(/\bMc\b\.?/gi, 'Marcos')
      .replace(/\bLc\b\.?/gi, 'Lucas')
      .replace(/\bJo\b\.?/gi, 'João')
      .replace(/\bRm\b\.?/gi, 'Romanos')
      .replace(/\bGn\b\.?/gi, 'Gênesis')
      .replace(/\bEx\b\.?/gi, 'Êxodo')
      .replace(/\bCap\b\.?\s*(\d+)/gi, 'Capítulo $1')
      .replace(/\bv\b\.?\s*(\d+)/gi, 'Versículo $1');

    // Humanized Pausing: Insert subtle reflective pauses at commas, periods and colons
    clean = clean
      .replace(/;\s*/g, ', ... ')
      .replace(/:\s*/g, ': ... ')
      .replace(/\.\s+/g, '. ... ')
      .replace(/\?\s+/g, '? ... ')
      .replace(/!\s+/g, '! ... ')
      .replace(/\n\n+/g, '. ... ... ');

    return clean;
  }

  // Search and select best Brazilian Portuguese voice with mature, low-pitched timbre
  private getBestVoice(): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => v.lang.startsWith('pt') || v.lang.includes('BR') || v.lang.includes('PT'));

    if (ptVoices.length === 0) return voices[0] || null;

    if (this.voiceArchetype === 'feminina') {
      const female = ptVoices.find(v => 
        v.name.toLowerCase().includes('maria') || 
        v.name.toLowerCase().includes('luciana') || 
        v.name.toLowerCase().includes('leticia') ||
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('francisca') ||
        v.name.toLowerCase().includes('heloisa') ||
        v.name.toLowerCase().includes('vitória')
      );
      if (female) return female;
    } else {
      // Prioritize natural mature/deep male Brazilian voices
      // e.g. "Google português do Brasil", "Microsoft Daniel", "Jorge", "Antônio", "pt-BR-Wavenet", "Natural"
      const matureMale = ptVoices.find(v => 
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('antonio') ||
        v.name.toLowerCase().includes('jorge') ||
        v.name.toLowerCase().includes('felipe') ||
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('male') ||
        (v.name.toLowerCase().includes('google') && !v.name.toLowerCase().includes('female'))
      );
      if (matureMale) return matureMale;
    }

    return ptVoices[0];
  }

  // Request high-fidelity AI Neural Speech (50-65yo mature deep male voice) from server
  private async fetchNeuralSpeech(text: string, voiceArchetype: VoiceArchetype): Promise<string | null> {
    try {
      const geminiVoice = VOICE_PROFILES[voiceArchetype]?.geminiVoice || 'Charon';
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: geminiVoice
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl && !data.fallback) {
          return data.audioUrl;
        }
      }
    } catch (err) {
      console.warn('[DevotionalAudio] Server TTS unavailable, switching to local speech synthesis:', err);
    }
    return null;
  }

  // Narrate verse list with synchronized highlighting and devotional cadence
  public async narrateVerses(
    verses: { verse: number; text: string; book_name?: string; chapter?: number }[],
    options?: {
      onVerseChange?: (verseNum: number) => void;
      onFinish?: () => void;
      includeBackgroundMusic?: boolean;
    }
  ) {
    this.stop();
    if (verses.length === 0) return;

    if (options?.includeBackgroundMusic !== false && this.musicVolume > 0) {
      this.startAmbientPad();
    }

    this.isSpeechPlaying = true;
    this.onVerseChangeCallback = options?.onVerseChange || null;
    this.notifyState(true);

    let currentIndex = 0;

    const speakNextVerse = () => {
      if (!this.isSpeechPlaying || currentIndex >= verses.length) {
        this.stop();
        if (options?.onFinish) options.onFinish();
        return;
      }

      const item = verses[currentIndex];
      if (this.onVerseChangeCallback) {
        this.onVerseChangeCallback(item.verse);
      }

      // Add respectful introduction for verse 1
      let rawText = '';
      if (currentIndex === 0 && item.book_name && item.chapter) {
        rawText = `Livro de ${item.book_name}, capítulo ${item.chapter}. ... `;
      }
      rawText += `Versículo ${item.verse}. ... ${item.text}`;

      const humanizedText = this.humanizeTextForSpeech(rawText);

      if (!('speechSynthesis' in window)) {
        currentIndex++;
        setTimeout(speakNextVerse, 1000);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(humanizedText);
      utterance.lang = 'pt-BR';

      const profile = VOICE_PROFILES[this.voiceArchetype] || VOICE_PROFILES.maduro;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = this.voiceVolume;

      const voice = this.getBestVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        currentIndex++;
        // Contemplative pause between verses for reflection (750ms)
        setTimeout(() => {
          if (this.isSpeechPlaying) {
            speakNextVerse();
          }
        }, 750);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis notice:', e);
        currentIndex++;
        speakNextVerse();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextVerse();
  }

  // Narrate any text (sermon, devotional, prayer, exegesis, chat) with rich expressive voice
  public async narrateText(
    title: string,
    body: string,
    options?: { onFinish?: () => void; includeBackgroundMusic?: boolean }
  ) {
    this.stop();

    if (options?.includeBackgroundMusic !== false && this.musicVolume > 0) {
      this.startAmbientPad();
    }

    this.isSpeechPlaying = true;
    this.notifyState(true);

    const fullContent = title ? `${title}. ... ... ${body}` : body;
    const humanizedText = this.humanizeTextForSpeech(fullContent);

    // 1. Try High-Quality Neural AI Voice first
    const neuralAudioUrl = await this.fetchNeuralSpeech(humanizedText.slice(0, 1500), this.voiceArchetype);
    
    if (neuralAudioUrl && this.isSpeechPlaying) {
      try {
        const audio = new Audio(neuralAudioUrl);
        audio.volume = this.voiceVolume;
        this.currentAudioElement = audio;

        audio.onended = () => {
          this.stop();
          if (options?.onFinish) options.onFinish();
        };

        audio.onerror = () => {
          this.fallbackToSpeechSynthesis(humanizedText, options);
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn('[DevotionalAudio] HTML5 Audio play error, falling back to Web Speech:', err);
      }
    }

    // 2. Fallback to calibrated humanized Speech Synthesis
    this.fallbackToSpeechSynthesis(humanizedText, options);
  }

  private fallbackToSpeechSynthesis(
    humanizedText: string,
    options?: { onFinish?: () => void }
  ) {
    if (!('speechSynthesis' in window)) {
      this.stop();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(humanizedText);
    utterance.lang = 'pt-BR';

    const profile = VOICE_PROFILES[this.voiceArchetype] || VOICE_PROFILES.maduro;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = this.voiceVolume;

    const voice = this.getBestVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      this.stop();
      if (options?.onFinish) options.onFinish();
    };

    utterance.onerror = () => {
      this.stop();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (this.currentAudioElement) {
      this.currentAudioElement.play();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    this.isSpeechPlaying = false;
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.stopAmbientPad();
    this.notifyState(false);
    if (this.onVerseChangeCallback) {
      this.onVerseChangeCallback(0);
    }
  }

  public setArchetype(arch: VoiceArchetype) {
    this.voiceArchetype = arch;
    localStorage.setItem('devotional_voice_archetype', arch);
  }

  public onStateChange(callback: (isPlaying: boolean) => void) {
    this.onStateChangeCallback = callback;
  }

  private notifyState(isPlaying: boolean) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(isPlaying);
    }
  }

  public isPlaying(): boolean {
    return this.isSpeechPlaying;
  }
}

export const devotionalAudio = new DevotionalAudioEngine();
