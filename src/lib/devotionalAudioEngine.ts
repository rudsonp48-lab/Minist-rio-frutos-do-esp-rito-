// Devotional Audio Engine: Narração da Bíblia com Voz Suave e Fundo Musical de Paz (Estilo Cid Moreira / Devocional)

export type VoiceArchetype = 'solene' | 'suave' | 'feminina';

class DevotionalAudioEngine {
  private audioCtx: AudioContext | null = null;
  private backgroundGainNode: GainNode | null = null;
  private isBackgroundPlaying = false;
  private bgOscillators: OscillatorNode[] = [];
  private bgInterval: number | null = null;

  private isSpeechPlaying = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onVerseChangeCallback: ((verseNum: number) => void) | null = null;
  private onStateChangeCallback: ((isPlaying: boolean) => void) | null = null;

  // Settings
  public voiceArchetype: VoiceArchetype = 'solene';
  public voiceVolume = 1.0;
  public musicVolume = 0.25;
  public speechRate = 0.88; // Calm and solemn pace
  public speechPitch = 0.85; // Deeper, more solemn tone

  constructor() {
    // Load saved preferences
    const savedVoice = localStorage.getItem('devotional_voice_archetype') as VoiceArchetype;
    if (savedVoice) this.voiceArchetype = savedVoice;

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

  // Generate warm, peaceful, heavenly ambient synth pad (D Major / G Major worship chords)
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
      masterGain.gain.linearRampToValueAtTime(this.musicVolume * 0.4, ctx.currentTime + 3);
      this.backgroundGainNode = masterGain;

      // Low pass filter for soft, warm tone (no harsh highs)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

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
          osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), ctx.currentTime);

          // Gentle fade in & fade out
          const now = ctx.currentTime;
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.linearRampToValueAtTime(0.08 / currentChord.length, now + 2);
          oscGain.gain.linearRampToValueAtTime(0.04 / currentChord.length, now + 7);
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
        this.backgroundGainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 1.5);
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
        this.backgroundGainNode.gain.linearRampToValueAtTime(vol * 0.4, this.audioCtx.currentTime + 0.3);
      } catch {}
    }
  }

  // Get optimal Brazilian Portuguese voice matching the desired archetype
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
        v.name.toLowerCase().includes('heloisa')
      );
      if (female) return female;
    } else {
      // Solene / Suave male or natural deep voice (Google Português, Daniel, Jorge, etc.)
      const natural = ptVoices.find(v => 
        v.name.toLowerCase().includes('google') || 
        v.name.toLowerCase().includes('daniel') || 
        v.name.toLowerCase().includes('jorge') ||
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('premium') ||
        v.name.toLowerCase().includes('male')
      );
      if (natural) return natural;
    }

    return ptVoices[0];
  }

  // Narrate list of verses with verse-by-verse synchronization and devotional pacing
  public narrateVerses(
    verses: { verse: number; text: string; book_name?: string; chapter?: number }[],
    options?: {
      onVerseChange?: (verseNum: number) => void;
      onFinish?: () => void;
      includeBackgroundMusic?: boolean;
    }
  ) {
    if (!('speechSynthesis' in window)) return;
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

      // Add peaceful devotional intro for verse 1 if applicable
      let textToRead = '';
      if (currentIndex === 0 && item.book_name && item.chapter) {
        textToRead = `Leitura da Santa Palavra de Deus. Livro de ${item.book_name}, capítulo ${item.chapter}. ... `;
      }
      
      textToRead += `Versículo ${item.verse}. ... ${item.text}`;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'pt-BR';

      // Set archetype speech tone
      if (this.voiceArchetype === 'solene') {
        utterance.rate = 0.85; // Solemn and profound
        utterance.pitch = 0.82; // Deep and reverent (Cid Moreira style)
      } else if (this.voiceArchetype === 'suave') {
        utterance.rate = 0.90; // Gentle and warm
        utterance.pitch = 0.95;
      } else {
        utterance.rate = 0.92; // Serene female tone
        utterance.pitch = 1.05;
      }

      utterance.volume = this.voiceVolume;

      const voice = this.getBestVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        currentIndex++;
        // Natural contemplative pause of 800ms between verses for meditation
        setTimeout(() => {
          if (this.isSpeechPlaying) {
            speakNextVerse();
          }
        }, 800);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        currentIndex++;
        speakNextVerse();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextVerse();
  }

  // Narrate a single devotion or prayer text with soft cadence
  public narrateText(
    title: string,
    body: string,
    options?: { onFinish?: () => void; includeBackgroundMusic?: boolean }
  ) {
    if (!('speechSynthesis' in window)) return;
    this.stop();

    if (options?.includeBackgroundMusic !== false && this.musicVolume > 0) {
      this.startAmbientPad();
    }

    this.isSpeechPlaying = true;
    this.notifyState(true);

    const fullText = `${title}. ... ... ${body}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'pt-BR';

    if (this.voiceArchetype === 'solene') {
      utterance.rate = 0.86;
      utterance.pitch = 0.84;
    } else if (this.voiceArchetype === 'suave') {
      utterance.rate = 0.90;
      utterance.pitch = 0.95;
    } else {
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
    }

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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    this.isSpeechPlaying = false;
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
