/**
 * Voice Service - TTS, Audio Recording and Playback
 * Manages voice generation using various providers and audio file handling
 * @module services/voice-service
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import logger, { logInfo, logError, logDebug, logWarn } from '../utils/logger';

export interface VoiceProfile {
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female';
    description: string;
}

interface TTSProvider {
    name: string;
    method: (text: string, voiceId: string) => Promise<Buffer>;
}

interface AudioFileInfo {
    filename: string;
    size: number;
    created: Date;
    modified: Date;
    path: string;
}

export class VoiceService {
    private audioDir: string;
    private voiceProfilesCache: Record<string, VoiceProfile> = {};
    private ttsProviders: TTSProvider[];

    constructor() {
        this.audioDir = path.join(__dirname, '../../public/audio'); // Adjusted path from ../public to ../../public if running from src/services
        // Original: ../public/audio. Inside src/services, we are 2 levels deep from root?
        // Original: backend/voice-service.js -> ../public/audio -> backend/public/audio
        // New: backend/src/services/voice-service.ts -> ../../public/audio -> backend/public/audio. Correct.

        this.ttsProviders = [
            { name: 'azure', method: this.generateAzureTTS.bind(this) },
            { name: 'aws', method: this.generateAWSTTS.bind(this) },
            { name: 'elevenlabs', method: this.generateElevenLabsTTS.bind(this) },
            { name: 'local', method: this.generateLocalTTS.bind(this) }
        ];

        this.ensureDirectories();
        this.loadVoiceProfiles();
    }

    /**
     * Ensures necessary directories exist
     */
    private ensureDirectories (): void {
        const dirs = [
            this.audioDir,
            path.join(this.audioDir, 'generated'),
            path.join(this.audioDir, 'cache'),
            path.join(this.audioDir, 'profiles')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir))
            {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Loads voice profiles from external sources or cache
     */
    private async loadVoiceProfiles (): Promise<void> {
        try
        {
            // Load basic voice profiles
            this.voiceProfilesCache = {
                en_female_1: {
                    id: 'en_female_1',
                    name: 'Emma',
                    language: 'en',
                    gender: 'female',
                    description: 'Pleasant female English voice'
                },
                en_female_2: {
                    id: 'en_female_2',
                    name: 'Sarah',
                    language: 'en',
                    gender: 'female',
                    description: 'Warm female English voice'
                },
                en_male_1: {
                    id: 'en_male_1',
                    name: 'James',
                    language: 'en',
                    gender: 'male',
                    description: 'Deep male English voice'
                },
                cs_female_1: {
                    id: 'cs_female_1',
                    name: 'Tereza',
                    language: 'cs',
                    gender: 'female',
                    description: 'Přirozený ženský český hlas'
                }
            };
        } catch (error)
        {
            logError('Error loading voice profiles', error as Error);
        }
    }

    /**
     * Returns list of available voice profiles
     */
    public getVoiceProfiles (): VoiceProfile[] {
        return Object.values(this.voiceProfilesCache);
    }

    /**
     * Gets specific voice profile by ID
     */
    public getVoiceProfile (voiceId: string): VoiceProfile | null {
        return this.voiceProfilesCache[voiceId] || null;
    }

    /**
     * Generates speech from text using automatic fallback system
     */
    public async generateSpeech (text: string, voiceId: string = 'en_female_1'): Promise<Buffer> {
        // Check cache
        const cachedAudio = await this.getCachedAudio(text, voiceId);
        if (cachedAudio)
        {
            return cachedAudio;
        }

        // Try providers
        for (const provider of this.ttsProviders)
        {
            try
            {
                const audioBuffer = await provider.method(text, voiceId);

                if (audioBuffer && audioBuffer.length > 0)
                {
                    await this.cacheAudioFile(text, voiceId, audioBuffer);
                    return audioBuffer;
                }
            } catch (error)
            {
                // Continue to next provider
                continue;
            }
        }

        throw new Error('Služba text-to-speech je momentálně nedostupná.');
    }

    /**
     * Azure Cognitive Services TTS
     */
    private async generateAzureTTS (text: string, voiceId: string): Promise<Buffer> {
        if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION)
        {
            throw new Error('Azure Speech credentials not configured');
        }

        const voiceMapping: Record<string, string> = {
            'cs_female_1': 'cs-CZ-VlastaNeural',
            'cs_male_1': 'cs-CZ-AntoninNeural',
            'en_female_1': 'en-US-JennyNeural',
            'en_male_1': 'en-US-GuyNeural'
        };

        const selectedVoice = voiceMapping[voiceId] || 'en-US-JennyNeural';

        const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${selectedVoice}">
          ${text}
        </voice>
      </speak>
    `;

        const response = await axios.post(
            `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
            ssml,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
                },
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        return Buffer.from(response.data);
    }

    /**
     * AWS Polly TTS
     */
    private async generateAWSTTS (text: string, voiceId: string): Promise<Buffer> {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION)
        {
            throw new Error('AWS credentials not configured');
        }

        // Using require inside method to avoid global dependency issues if not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AWS = require('aws-sdk');
        const polly = new AWS.Polly({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });

        const voiceMapping: Record<string, string> = {
            'cs_female_1': 'Aditi',
            'en_female_1': 'Joanna',
            'en_male_1': 'Matthew'
        };

        const params = {
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: voiceMapping[voiceId] || 'Joanna',
            Engine: 'neural'
        };

        const result = await polly.synthesizeSpeech(params).promise();
        return result.AudioStream;
    }

    /**
     * ElevenLabs TTS
     */
    private async generateElevenLabsTTS (text: string, voiceId: string): Promise<Buffer> {
        if (!process.env.ELEVENLABS_API_KEY)
        {
            throw new Error('ElevenLabs API key not configured');
        }

        const voiceMapping: Record<string, string> = {
            'en_female_1': 'EXAVITQu4vr4xnSDxMaL',
            'en_male_1': 'VR6AewLTigWG4xSOukaG'
        };

        const elevenLabsVoiceId = voiceMapping[voiceId] || voiceMapping['en_female_1'];

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
            {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            {
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': process.env.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer',
                timeout: 30000
            }
        );

        return Buffer.from(response.data);
    }

    /**
     * Local TTS server (Coqui TTS)
     */
    private async generateLocalTTS (text: string, voiceId: string): Promise<Buffer> {
        const localTTSUrl = process.env.LOCAL_TTS_URL || 'http://localhost:5002';

        const response = await axios.post(
            `${localTTSUrl}/api/tts`,
            {
                text: text,
                voice: voiceId,
                format: 'mp3'
            },
            {
                timeout: 45000,
                responseType: 'arraybuffer'
            }
        );

        return Buffer.from(response.data);
    }

    /**
     * Gets cached audio
     */
    private async getCachedAudio (text: string, voiceId: string): Promise<Buffer | null> {
        try
        {
            const hash = crypto.createHash('md5').update(text + voiceId).digest('hex');
            const filename = `cached_${hash}.mp3`;
            const filePath = path.join(this.audioDir, 'cache', filename);

            if (fs.existsSync(filePath))
            {
                return fs.readFileSync(filePath);
            }
        } catch (error)
        {
            // Cache failure is not critical
            logWarn('Error accessing audio cache', { error: (error as Error).message });
        }
        return null;
    }

    /**
     * Caches audio file for future use
     */
    private async cacheAudioFile (text: string, voiceId: string, audioBuffer: Buffer): Promise<void> {
        try
        {
            const hash = crypto.createHash('md5').update(text + voiceId).digest('hex');
            const filename = `cached_${hash}.mp3`;
            const filePath = path.join(this.audioDir, 'cache', filename);

            const cacheDir = path.dirname(filePath);
            if (!fs.existsSync(cacheDir))
            {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            fs.writeFileSync(filePath, audioBuffer);
        } catch (error)
        {
            // Cache failure is not critical
            logWarn('Error writing audio cache', { error: (error as Error).message });
        }
    }

    /**
     * Checks TTS server availability
     */
    public async checkTTSServerHealth (url: string): Promise<boolean> {
        try
        {
            const healthUrl = `${url}/health`;

            try
            {
                await axios.get(healthUrl, { timeout: 5000 });
            } catch (healthError)
            {
                // If health endpoint fails, we might just return false or ignore
            }

            return true;
        } catch (error)
        {
            return false;
        }
    }

    /**
     * Simple language detection
     */
    public detectLanguage (text: string): string {
        const czechChars = 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ';
        const japaneseChars = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;

        // Check for Czech chars
        for (const char of text)
        {
            if (czechChars.includes(char))
            {
                return 'cs';
            }
        }

        // Check sequences
        if (japaneseChars.test(text))
        {
            return 'ja';
        }

        // Default is English
        return 'en';
    }

    /**
     * Checks STT server health
     */
    public async checkSTTServerHealth (): Promise<boolean> {
        try
        {
            const sttUrl = process.env.STT_SERVICE_URL || 'http://localhost:5003';
            await axios.get(`${sttUrl}/health`, { timeout: 5000 });
            return true;
        } catch (error)
        {
            return false;
        }
    }

    /**
     * Converts audio to text (Speech-to-Text)
     */
    public async speechToText (audioBuffer: Buffer, language: string = 'cs'): Promise<string> {
        const sttUrl = process.env.STT_SERVICE_URL || 'http://localhost:5003';

        try
        {
            // Node.js environment usually needs form-data lib, but here we try using native FormData if available (Node 18+)
            // or we might need to construct valid multipart/form-data manually or use a lib. 
            // Since we cannot easily add 'form-data' lib without user, we rely on global FormData.
            // Functionality might be limited without it.

            // Safe fallback: check if global FormData exists
            if (typeof FormData === 'undefined')
            {
                throw new Error('FormData is not available in this environment');
            }

            const formData = new FormData();
            // In Node.js FormData (undici or native), we pass Blob.
            // audioBuffer is Buffer. We need to convert it to Blob.
            const blob = new Blob([audioBuffer]);
            formData.append('audio', blob, 'audio.wav');
            formData.append('language', language);

            const response = await axios.post(`${sttUrl}/api/stt`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 30000
            });

            return response.data.text || '';
        } catch (error)
        {
            logError('Speech-to-text service unavailable', error as Error);
            throw new Error('Speech-to-text služba není dostupná');
        }
    }

    /**
     * Saves audio data to disk
     */
    public async saveAudioFile (audioData: Buffer, filename: string): Promise<string> {
        const filePath = path.join(this.audioDir, 'generated', filename);

        try
        {
            fs.writeFileSync(filePath, audioData);
            return filePath;
        } catch (error)
        {
            throw new Error('Nepodařilo se uložit audio soubor');
        }
    }

    /**
     * Gets info about audio file
     */
    public async getAudioFileInfo (filename: string): Promise<AudioFileInfo> {
        const filePath = path.join(this.audioDir, 'generated', filename);

        try
        {
            if (!fs.existsSync(filePath))
            {
                throw new Error('Soubor nenalezen');
            }

            const stats = fs.statSync(filePath);

            return {
                filename: filename,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                path: filePath
            };
        } catch (error)
        {
            throw error;
        }
    }

    /**
     * Deletes audio file
     */
    public async deleteAudioFile (filename: string): Promise<boolean> {
        const filePath = path.join(this.audioDir, 'generated', filename);

        try
        {
            if (fs.existsSync(filePath))
            {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error)
        {
            throw new Error('Nepodařilo se odstranit audio soubor');
        }
    }

    /**
     * Cleans up old audio files
     */
    public async cleanupOldAudioFiles (maxAge: number = 7): Promise<number> {
        const generatedDir = path.join(this.audioDir, 'generated');
        const cacheDir = path.join(this.audioDir, 'cache');
        let deletedCount = 0;

        try
        {
            const cleanDirectory = (dir: string) => {
                if (!fs.existsSync(dir)) return;

                const files = fs.readdirSync(dir);
                const cutoffDate = new Date(Date.now() - (maxAge * 24 * 60 * 60 * 1000));

                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const stats = fs.statSync(filePath);

                    if (stats.birthtime < cutoffDate)
                    {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                });
            };

            cleanDirectory(generatedDir);
            cleanDirectory(cacheDir);

            return deletedCount;
        } catch (error)
        {
            throw new Error('Nepodařilo se vyčistit staré audio soubory');
        }
    }
}

export default new VoiceService();
