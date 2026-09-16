/**
 * voiceService.ts
 * ============================================================
 * Advanced Voice Service for AI Virtual Assistant
 * 
 * Provides:
 * - Multiple TTS providers (Web Speech API, ElevenLabs, Azure)
 * - Voice cloning
 * - Audio streaming
 * - Voice quality enhancement
 * - Multi-language support
 * 
 * ============================================================
 */

import { glaciaVoice, type VoiceMoodType } from '../glaciaVoiceEngine';
import { AvatarEmotion, MOOD_TO_EMOTION, EMOTION_TO_GESTURE } from '../../../../core/types/glaciaAvatar';

// ============================================================================
// VOICE PROVIDER CONFIGURATION
// ============================================================================

/**
 * TTS Provider types
 */
export type TTSProvider = 'web_speech' | 'elevenlabs' | 'azure' | 'google' | 'amazon';

/**
 * Voice configuration for each provider
 */
export interface VoiceConfig {
  provider: TTSProvider;
  apiKey?: string;
  voiceId?: string;
  model?: string;
  region?: string;
  language?: string;
  languageCode?: string;
  voiceName?: string;
  voiceType?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

/**
 * ElevenLabs specific configuration
 */
export interface ElevenLabsConfig extends VoiceConfig {
  provider: 'elevenlabs';
  apiKey: string;
  voiceId?: string; // Use default if not specified
  model?: 'eleven_multilingual_v2' | 'eleven_monolingual_v1' | string;
}

/**
 * Azure TTS specific configuration
 */
export interface AzureTTSConfig extends VoiceConfig {
  provider: 'azure';
  apiKey: string;
  region: string; // e.g., 'eastus'
  voiceName?: string; // e.g., 'vi-VN-HoaiNeural', 'en-US-AriaNeural'
  voiceType?: 'Neural' | 'Standard';
}

/**
 * Google TTS specific configuration
 */
export interface GoogleTTSConfig extends VoiceConfig {
  provider: 'google';
  apiKey?: string;
  voiceName?: string;
  languageCode?: string;
}

/**
 * Amazon Polly specific configuration
 */
export interface AmazonPollyConfig extends VoiceConfig {
  provider: 'amazon';
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  voiceId?: string;
}

/**
 * Unified voice options
 */
export interface VoiceOptions {
  text: string;
  emotion?: AvatarEmotion | VoiceMoodType;
  mood?: VoiceMoodType;
  provider?: TTSProvider;
  voiceId?: string;
  language?: string;
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onChunk?: (chunk: ArrayBuffer) => void; // For streaming
}

/**
 * Voice cloning options
 */
export interface VoiceCloningOptions {
  name: string;
  audioSamples: ArrayBuffer[] | string[]; // Audio files for cloning
  provider: 'elevenlabs';
  apiKey: string;
  description?: string;
}

// ============================================================================
// VOICE MANAGER
// ============================================================================

/**
 * Voice Manager - Manages multiple TTS providers
 */
class VoiceManager {
  private providers: Map<TTSProvider, any> = new Map();
  private activeProvider: TTSProvider = 'web_speech';
  private voiceCache: Map<string, { voice: any; config: VoiceConfig }> = new Map();

  /**
   * Configure a TTS provider
   */
  configureProvider(provider: TTSProvider, config: VoiceConfig): void {
    this.providers.set(provider, config);
    this.voiceCache.clear(); // Clear cache when reconfiguring
  }

  /**
   * Set active provider
   */
  setActiveProvider(provider: TTSProvider): void {
    if (this.providers.has(provider)) {
      this.activeProvider = provider;
    } else {
      console.warn(`Provider ${provider} not configured. Using web_speech as fallback.`);
      this.activeProvider = 'web_speech';
    }
  }

  /**
   * Get active provider
   */
  getActiveProvider(): TTSProvider {
    return this.activeProvider;
  }

  /**
   * Speak text using the active provider
   */
  async speak(options: VoiceOptions): Promise<void> {
    const provider = options.provider || this.activeProvider;

    switch (provider) {
      case 'web_speech':
        return this.speakWithWebSpeech(options);
      case 'elevenlabs':
        return this.speakWithElevenLabs(options);
      case 'azure':
        return this.speakWithAzureTTS(options);
      case 'google':
        return this.speakWithGoogleTTS(options);
      case 'amazon':
        return this.speakWithAmazonPolly(options);
      default:
        return this.speakWithWebSpeech(options);
    }
  }

  /**
   * Speak with Web Speech API (fallback)
   */
  private async speakWithWebSpeech(options: VoiceOptions): Promise<void> {
    try {
      options.onStart?.();
      
      // Map emotion to mood
      const mood = this.mapEmotionToMood(options.emotion || options.mood);
      
      glaciaVoice.speak(options.text, mood, () => {
        options.onEnd?.();
      });
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Speak with ElevenLabs (requires API key)
   */
  private async speakWithElevenLabs(options: VoiceOptions): Promise<void> {
    const config = this.providers.get('elevenlabs') as ElevenLabsConfig;
    
    if (!config || !config.apiKey) {
      console.warn('ElevenLabs not configured. Falling back to Web Speech API.');
      return this.speakWithWebSpeech(options);
    }

    try {
      options.onStart?.();

      const apiKey = config.apiKey;
      const voiceId = config.voiceId || '21m00Tcm4TlvDq8ikWAM';
      const model = config.model || 'eleven_multilingual_v2';

      // Map emotion to ElevenLabs voice settings
      const voiceSettings = this.getElevenLabsVoiceSettings(options.emotion);

      const requestBody = {
        text: options.text,
        model_id: model,
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarityBoost,
          style: voiceSettings.style,
          use_speaker_boost: true,
        },
      };

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?api_key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioData = await response.arrayBuffer();
      
      // Play the audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        options.onEnd?.();
        audioContext.close();
      };
      
      source.start();
      
      // Send chunks for streaming (if callback provided)
      if (options.onChunk) {
        // For now, send the full audio. In streaming mode, we'd process chunks.
        options.onChunk(audioData);
      }

    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      // Fallback to web speech
      this.speakWithWebSpeech(options);
    }
  }

  /**
   * Speak with Azure TTS (requires API key)
   */
  private async speakWithAzureTTS(options: VoiceOptions): Promise<void> {
    const config = this.providers.get('azure') as AzureTTSConfig;
    
    if (!config || !config.apiKey || !config.region) {
      console.warn('Azure TTS not configured. Falling back to Web Speech API.');
      return this.speakWithWebSpeech(options);
    }

    try {
      options.onStart?.();

      const apiKey = config.apiKey;
      const region = config.region;
      const voiceName = config.voiceName || 'vi-VN-HoaiNeural';

      // Create SSML for emotion
      const ssml = this.createAzureSSML(options.text, voiceName, options.emotion);

      const response = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            'User-Agent': 'LedgerFlow-Avatar',
          },
          body: ssml,
        }
      );

      if (!response.ok) {
        throw new Error(`Azure TTS API error: ${response.statusText}`);
      }

      const audioData = await response.arrayBuffer();
      
      // Play the audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        options.onEnd?.();
        audioContext.close();
      };
      
      source.start();
      
      if (options.onChunk) {
        options.onChunk(audioData);
      }

    } catch (error) {
      console.error('Azure TTS error:', error);
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      this.speakWithWebSpeech(options);
    }
  }

  /**
   * Speak with Google TTS (requires API key)
   */
  private async speakWithGoogleTTS(options: VoiceOptions): Promise<void> {
    const config = this.providers.get('google') as GoogleTTSConfig;
    
    if (!config || !config.apiKey) {
      console.warn('Google TTS not configured. Falling back to Web Speech API.');
      return this.speakWithWebSpeech(options);
    }

    try {
      options.onStart?.();

      const apiKey = config.apiKey;
      const voiceName = config.voiceName || 'vi-VN-Standard-A';
      const languageCode = config.languageCode || 'vi-VN';

      // Google TTS uses URL parameters
      const text = encodeURIComponent(options.text);
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

      const requestBody = {
        input: { text },
        voice: { name: voiceName, languageCode },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: options.pitch || 0,
          speakingRate: options.rate || 1,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.statusText}`);
      }

      const data = await response.json();
      const audioData = Buffer.from(data.audioContent, 'base64');
      
      // Play the audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioData.buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        options.onEnd?.();
        audioContext.close();
      };
      
      source.start();
      
      if (options.onChunk) {
        options.onChunk(audioData.buffer);
      }

    } catch (error) {
      console.error('Google TTS error:', error);
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
      this.speakWithWebSpeech(options);
    }
  }

  /**
   * Speak with Amazon Polly (requires credentials)
   */
  private async speakWithAmazonPolly(options: VoiceOptions): Promise<void> {
    const config = this.providers.get('amazon') as AmazonPollyConfig;
    
    if (!config || !config.region) {
      console.warn('Amazon Polly not configured. Falling back to Web Speech API.');
      return this.speakWithWebSpeech(options);
    }

    // Amazon Polly requires AWS SDK and credentials setup
    // This is a placeholder implementation
    console.warn('Amazon Polly integration requires AWS SDK. Falling back to Web Speech API.');
    return this.speakWithWebSpeech(options);
  }

  /**
   * Map emotion to mood for Web Speech API
   */
  private mapEmotionToMood(emotion?: AvatarEmotion | VoiceMoodType): VoiceMoodType {
    if (!emotion) return 'idle';
    
    const emotionStr = typeof emotion === 'string' ? emotion : 'NEUTRAL';
    const moodMap: Record<string, VoiceMoodType> = {
      NEUTRAL: 'idle',
      CONFIDENT_SMILE: 'happy',
      SERIOUS_EXECUTIVE: 'thinking',
      ENTHUSIASTIC: 'happy',
      HAPPY: 'happy',
      CURIOUS: 'curious',
      THINKING: 'thinking',
      LISTENING: 'listening',
      ALERT: 'alert',
      CELEBRATING: 'celebrating',
      ANGRY: 'alert',
      SAD: 'thinking',
      SURPRISED: 'curious',
      idle: 'idle',
      happy: 'happy',
      curious: 'curious',
      thinking: 'thinking',
      listening: 'listening',
      dispatching: 'celebrating',
      celebrating: 'celebrating',
      alert: 'alert',
      sleeping: 'idle',
    };

    return moodMap[emotionStr] || 'idle';
  }

  /**
   * Get ElevenLabs voice settings for emotion
   */
  private getElevenLabsVoiceSettings(emotion?: AvatarEmotion | VoiceMoodType): {
    stability: number;
    similarityBoost: number;
    style: number;
  } {
    const emotionStr = typeof emotion === 'string' ? emotion : 'NEUTRAL';
    
    const settingsMap: Record<string, { stability: number; similarityBoost: number; style: number }> = {
      NEUTRAL: { stability: 0.5, similarityBoost: 0.5, style: 0.0 },
      CONFIDENT_SMILE: { stability: 0.7, similarityBoost: 0.8, style: 0.2 },
      SERIOUS_EXECUTIVE: { stability: 0.8, similarityBoost: 0.6, style: -0.2 },
      ENTHUSIASTIC: { stability: 0.4, similarityBoost: 0.7, style: 0.5 },
      HAPPY: { stability: 0.6, similarityBoost: 0.9, style: 0.3 },
      CURIOUS: { stability: 0.5, similarityBoost: 0.7, style: 0.4 },
      THINKING: { stability: 0.8, similarityBoost: 0.5, style: -0.1 },
      LISTENING: { stability: 0.7, similarityBoost: 0.7, style: 0.1 },
      ALERT: { stability: 0.6, similarityBoost: 0.6, style: 0.5 },
      CELEBRATING: { stability: 0.3, similarityBoost: 0.9, style: 0.8 },
      ANGRY: { stability: 0.4, similarityBoost: 0.5, style: -0.3 },
      SAD: { stability: 0.8, similarityBoost: 0.4, style: -0.5 },
      SURPRISED: { stability: 0.3, similarityBoost: 0.8, style: 0.6 },
      idle: { stability: 0.5, similarityBoost: 0.5, style: 0.0 },
      happy: { stability: 0.6, similarityBoost: 0.9, style: 0.3 },
      curious: { stability: 0.5, similarityBoost: 0.7, style: 0.4 },
      thinking: { stability: 0.8, similarityBoost: 0.5, style: -0.1 },
      listening: { stability: 0.7, similarityBoost: 0.7, style: 0.1 },
      dispatching: { stability: 0.4, similarityBoost: 0.8, style: 0.6 },
      celebrating: { stability: 0.3, similarityBoost: 0.9, style: 0.8 },
      alert: { stability: 0.6, similarityBoost: 0.6, style: 0.5 },
      sleeping: { stability: 0.9, similarityBoost: 0.3, style: -0.5 },
    };

    return settingsMap[emotionStr] || settingsMap.NEUTRAL;
  }

  /**
   * Create Azure SSML for emotion
   */
  private createAzureSSML(text: string, voiceName: string, emotion?: AvatarEmotion | VoiceMoodType): string {
    const emotionStr = typeof emotion === 'string' ? emotion : 'NEUTRAL';
    
    // Map emotion to Azure emotion style
    const styleMap: Record<string, string> = {
      HAPPY: 'cheerful',
      CELEBRATING: 'excited',
      ALERT: 'angry',
      SAD: 'sad',
      CURIOUS: 'chat',
      THINKING: 'calm',
      LISTENING: 'friendly',
      SERIOUS_EXECUTIVE: 'formal',
      happy: 'cheerful',
      curious: 'chat',
      thinking: 'calm',
      alert: 'angry',
      default: 'default',
    };

    const style = styleMap[emotionStr] || 'default';
    
    return `<speak version="1.0" xml:lang="vi-VN">
      <voice name="${voiceName}">
        <mstts:express-as style="${style}">
          ${text}
        </mstts:express-as>
      </voice>
    </speak>`;
  }

  /**
   * Stop all speech
   */
  stopAll(): void {
    glaciaVoice.stopSpeaking();
    
    // In future, we'd also stop any audio contexts from other providers
    // For now, just stop web speech
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: TTSProvider): boolean {
    return this.providers.has(provider);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): TTSProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clone a voice (ElevenLabs only)
   */
  async cloneVoice(options: VoiceCloningOptions): Promise<string | null> {
    if (options.provider !== 'elevenlabs' || !options.apiKey) {
      console.error('Voice cloning is only supported for ElevenLabs with API key');
      return null;
    }

    try {
      const apiKey = options.apiKey;
      const requestBody = {
        name: options.name,
        description: options.description || 'Cloned voice for LedgerFlow Avatar',
        samples: options.audioSamples.map(sample => {
          if (typeof sample === 'string') {
            return { uri: sample };
          }
          // For ArrayBuffer, we'd need to upload it first
          return { uri: '' };
        }),
      };

      const response = await fetch(
        'https://api.elevenlabs.io/v1/voices/add',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs voice cloning error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voice_id;

    } catch (error) {
      console.error('Voice cloning error:', error);
      return null;
    }
  }

  /**
   * List available voices for a provider
   */
  async listVoices(provider: TTSProvider): Promise<any[]> {
    switch (provider) {
      case 'elevenlabs':
        const config = this.providers.get('elevenlabs') as ElevenLabsConfig;
        if (!config || !config.apiKey) return [];
        
        try {
          const response = await fetch(
            'https://api.elevenlabs.io/v1/voices',
            {
              headers: { 'xi-api-key': config.apiKey },
            }
          );
          if (response.ok) {
            const data = await response.json();
            return data.voices || [];
          }
        } catch (error) {
          console.error('Failed to fetch ElevenLabs voices:', error);
        }
        return [];

      case 'azure':
        // Azure voices would be fetched from their API
        return [
          { name: 'vi-VN-HoaiNeural', language: 'vi-VN', gender: 'Female' },
          { name: 'vi-VN-NamMinhNeural', language: 'vi-VN', gender: 'Male' },
          { name: 'en-US-AriaNeural', language: 'en-US', gender: 'Female' },
          { name: 'en-US-RyanNeural', language: 'en-US', gender: 'Male' },
        ];

      case 'google':
        return [
          { name: 'vi-VN-Standard-A', language: 'vi-VN', gender: 'Female' },
          { name: 'vi-VN-Standard-D', language: 'vi-VN', gender: 'Male' },
        ];

      case 'web_speech':
      case 'amazon':
      default:
        return [];
    }
  }

  /**
   * Get default voice for a language
   */
  getDefaultVoice(language: string = 'vi-VN'): string {
    const voiceMap: Record<string, string> = {
      'vi-VN': 'vi-VN-HoaiNeural',
      'en-US': 'en-US-AriaNeural',
      'en-GB': 'en-GB-SoniaNeural',
    };
    return voiceMap[language] || voiceMap['vi-VN'];
  }
}

// ============================================================================
// STREAMING VOICE MANAGER (WebSocket)
// ============================================================================

/**
 * Streaming Voice Manager for real-time LLM responses
 */
class StreamingVoiceManager {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private ttsManager: VoiceManager;

  constructor() {
    this.ttsManager = new VoiceManager();
  }

  /**
   * Connect to streaming LLM server
   */
  connect(url: string, onOpen?: () => void, onMessage?: (data: any) => void): void {
    this.disconnect();

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected for streaming voice');
      onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Disconnect from streaming server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Start streaming conversation
   */
  startConversation(
    prompt: string,
    options: {
      conversationId?: string;
      emotion?: AvatarEmotion | VoiceMoodType;
      onChunk?: (text: string, emotion: AvatarEmotion) => void;
      onComplete?: (text: string) => void;
      onError?: (error: Error) => void;
    } = {}
  ): void {
    if (!this.ws) {
      options.onError?.(new Error('WebSocket not connected'));
      return;
    }

    const message = {
      type: 'start_conversation',
      prompt,
      conversationId: options.conversationId,
      emotion: options.emotion,
      options: {
        stream: true,
        includeEmotion: true,
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Process streaming text chunk and convert to speech
   */
  async processChunk(
    chunk: string,
    emotion: AvatarEmotion | VoiceMoodType = 'NEUTRAL'
  ): Promise<void> {
    // For now, we'll collect chunks and speak at the end
    // In future, we can implement true streaming with audio chunks
    
    // Use the current TTS provider to speak the chunk
    await this.ttsManager.speak({
      text: chunk,
      emotion,
      onStart: () => {},
      onEnd: () => {},
      onError: (error) => {
        console.error('Streaming speech error:', error);
      },
    });
  }

  /**
   * Play audio chunk (for true streaming)
   */
  async playAudioChunk(chunk: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    this.audioQueue.push(chunk);
    
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.processQueue();
    }
  }

  /**
   * Process audio queue
   */
  private async processQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    const chunk = this.audioQueue.shift()!;
    
    try {
      const audioBuffer = await this.audioContext!.decodeAudioData(chunk);
      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);
      
      source.onended = () => {
        this.processQueue();
      };
      
      source.start();
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const voiceManager = new VoiceManager();
export const streamingVoiceManager = new StreamingVoiceManager();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Speak text with the best available provider
 */
export async function speak(
  text: string,
  options: Omit<VoiceOptions, 'text'> = {}
): Promise<void> {
  return voiceManager.speak({ text, ...options });
}

/**
 * Stop all speech
 */
export function stopSpeaking(): void {
  voiceManager.stopAll();
}

/**
 * Configure ElevenLabs
 */
export function configureElevenLabs(apiKey: string, voiceId?: string): void {
  voiceManager.configureProvider('elevenlabs', {
    provider: 'elevenlabs',
    apiKey,
    voiceId,
    model: 'eleven_multilingual_v2',
  });
}

/**
 * Configure Azure TTS
 */
export function configureAzureTTS(apiKey: string, region: string, voiceName?: string): void {
  voiceManager.configureProvider('azure', {
    provider: 'azure',
    apiKey,
    region,
    voiceName,
    voiceType: 'Neural',
  });
}

/**
 * Configure Google TTS
 */
export function configureGoogleTTS(apiKey: string, voiceName?: string): void {
  voiceManager.configureProvider('google', {
    provider: 'google',
    apiKey,
    voiceName,
    languageCode: 'vi-VN',
  });
}

/**
 * Set active TTS provider
 */
export function setActiveTTSProvider(provider: TTSProvider): void {
  voiceManager.setActiveProvider(provider);
}

/**
 * Clone a voice with ElevenLabs
 */
export async function cloneVoice(options: VoiceCloningOptions): Promise<string | null> {
  return voiceManager.cloneVoice(options);
}

/**
 * List voices for a provider
 */
export async function listVoices(provider: TTSProvider): Promise<any[]> {
  return voiceManager.listVoices(provider);
}
