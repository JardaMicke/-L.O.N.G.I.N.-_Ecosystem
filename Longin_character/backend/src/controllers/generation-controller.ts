/**
 * Generation Controller
 * Handles content generation (text-to-image, video, etc.)
 * @module controllers/generation-controller
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Generation, ApiResponse, GenerationType } from '../types';
import logger, { logError, logInfo } from '../utils/logger';

// In-memory history (in production use DB)
const generationHistory: Generation[] = [];

// Helper to simulate image generation
const simulateGenerateImage = (sourcePath: string, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        try
        {
            // Check if source exists
            if (!fs.existsSync(sourcePath))
            {
                // Try to find any jpg in assets as fallback
                const assetsDir = path.dirname(sourcePath);
                if (fs.existsSync(assetsDir))
                {
                    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
                    if (files.length > 0)
                    {
                        sourcePath = path.join(assetsDir, files[0]);
                    } else
                    {
                        return reject(new Error('No source images found for simulation'));
                    }
                } else
                {
                    return reject(new Error('Assets directory not found'));
                }
            }

            const destinationPath = path.join(__dirname, '../../../assets/images', fileName);
            const destinationDir = path.dirname(destinationPath);

            if (!fs.existsSync(destinationDir))
            {
                fs.mkdirSync(destinationDir, { recursive: true });
            }

            fs.copyFile(sourcePath, destinationPath, (err) => {
                if (err)
                {
                    reject(err);
                    return;
                }
                resolve(`/assets/images/${fileName}`);
            });
        } catch (error)
        {
            reject(error);
        }
    });
};

export class GenerationController {

    // Text-to-Image
    public async textToImage (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { prompt } = req.body;

            if (!prompt || typeof prompt !== 'string' || prompt.trim() === '')
            {
                res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Prázdný prompt' } });
                return;
            }

            let imagePath: string | null = null;

            // Try Stable Diffusion API
            try
            {
                const sdEndpoint = process.env.COMFYUI_API_URL || 'http://localhost:7860';

                const sdResponse = await axios.post(`${sdEndpoint}/sdapi/v1/txt2img`, {
                    prompt: prompt,
                    negative_prompt: 'blurry, low quality, low resolution',
                    width: 512,
                    height: 512,
                    steps: 20
                }, { timeout: 10000 }).catch(err => {
                    logInfo('Stable Diffusion API unavailable, using simulation');
                    return null;
                });

                if (sdResponse && sdResponse.data && sdResponse.data.images && sdResponse.data.images.length > 0)
                {
                    const imageBase64 = sdResponse.data.images[0];
                    const imageBuffer = Buffer.from(imageBase64, 'base64');
                    const fileName = `generated_${Date.now()}.png`;
                    const filePath = path.join(__dirname, '../../../assets/images', fileName);

                    const dir = path.dirname(filePath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                    fs.writeFileSync(filePath, imageBuffer);
                    imagePath = `/assets/images/${fileName}`;
                }
            } catch (error)
            {
                logError('Error communicating with SD API', error as Error);
            }

            // Fallback simulation
            if (!imagePath)
            {
                const imageId = Math.floor(Math.random() * 9) + 1;
                // These file names are from the original code, assuming they exist in assets
                const imageSources = ['4vm1b8i0b4.jpg', '7lhd4fax9q.jpg', 'ay6vzj7rj5.jpg', 'e5226mwzet.jpg', 'g2kbjg12a3.jpg', 'k2sfv7vkwl.jpg', 'll3ggouf6p.jpg', 'n3xhmjp8lh.jpg', 'ulv6ynlxw3.jpg'];
                // Use safe indexing
                const sourceFile = imageSources[(imageId - 1) % imageSources.length] || 'placeholder.jpg';
                const sourcePath = path.join(__dirname, '../../..', sourceFile); // Assumed in Longin_character root? Original code: ../.. from backend/controllers

                const fileName = `generated_${Date.now()}.jpg`;
                imagePath = await simulateGenerateImage(sourcePath, fileName);
            }

            const generation: Generation = {
                id: uuidv4(),
                success: true,
                promptType: 'text-to-image',
                prompt: prompt,
                image: imagePath,
                timestamp: new Date(),
                userId: (req as any).user?.id || 'anonymous'
            };

            generationHistory.push(generation);
            res.json(generation);
        } catch (error)
        {
            logError('Error in textToImage', error as Error);
            next(error);
        }
    }

    // Image-to-Image
    public async imageToImage (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { instructions } = req.body;
            const file = (req as any).file; // Multer file

            if (!file)
            {
                res.status(400).json({ success: false, error: { code: 'MISSING_FILE', message: 'Chybí zdrojový obrázek' } });
                return;
            }

            let imagePath: string | null = null;

            try
            {
                const sdEndpoint = process.env.COMFYUI_API_URL || 'http://localhost:7860';
                const imageBuffer = fs.readFileSync(file.path);
                const imageBase64 = imageBuffer.toString('base64');

                const sdResponse = await axios.post(`${sdEndpoint}/sdapi/v1/img2img`, {
                    init_images: [imageBase64],
                    prompt: instructions || 'enhance, detailed',
                    negative_prompt: 'blurry, low quality',
                    denoising_strength: 0.75,
                    steps: 20
                }, { timeout: 10000 }).catch(err => {
                    logInfo('SD API unavailable for img2img');
                    return null;
                });

                if (sdResponse && sdResponse.data?.images?.length > 0)
                {
                    const resultImageBase64 = sdResponse.data.images[0];
                    const resultImageBuffer = Buffer.from(resultImageBase64, 'base64');
                    const fileName = `transformed_${Date.now()}.png`;
                    const filePath = path.join(__dirname, '../../../assets/images', fileName);

                    const dir = path.dirname(filePath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                    fs.writeFileSync(filePath, resultImageBuffer);
                    imagePath = `/assets/images/${fileName}`;
                }
            } catch (error)
            {
                logError('Error in SD API img2img', error as Error);
            }

            if (!imagePath)
            {
                const imageId = Math.floor(Math.random() * 9) + 1;
                const imageSources = ['4vm1b8i0b4.jpg', '7lhd4fax9q.jpg', 'ay6vzj7rj5.jpg', 'e5226mwzet.jpg', 'g2kbjg12a3.jpg', 'k2sfv7vkwl.jpg', 'll3ggouf6p.jpg', 'n3xhmjp8lh.jpg', 'ulv6ynlxw3.jpg'];
                const sourceFile = imageSources[(imageId - 1) % imageSources.length] || 'placeholder.jpg';
                const sourcePath = path.join(__dirname, '../../..', sourceFile);
                const fileName = `transformed_${Date.now()}.jpg`;
                imagePath = await simulateGenerateImage(sourcePath, fileName);
            }

            const generation: Generation = {
                id: uuidv4(),
                success: true,
                promptType: 'image-to-image',
                instructions: instructions,
                originalImage: `/assets/uploads/${file.filename}`,
                image: imagePath,
                timestamp: new Date(),
                userId: (req as any).user?.id || 'anonymous'
            };

            generationHistory.push(generation);
            res.json(generation);
        } catch (error)
        {
            logError('Error in imageToImage', error as Error);
            next(error);
        }
    }

    // Text-to-Video
    public async textToVideo (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { prompt, duration } = req.body;

            if (!prompt || typeof prompt !== 'string' || prompt.trim() === '')
            {
                res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Prázdný prompt' } });
                return;
            }

            // Simulation
            const generation: Generation = {
                id: uuidv4(),
                success: true,
                promptType: 'text-to-video',
                prompt: prompt,
                duration: duration || 5,
                video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                timestamp: new Date(),
                userId: (req as any).user?.id || 'anonymous'
            };

            generationHistory.push(generation);
            res.json(generation);
        } catch (error)
        {
            logError('Error in textToVideo', error as Error);
            next(error);
        }
    }

    // Image-to-Video
    public async imageToVideo (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { instructions, duration } = req.body;
            const file = (req as any).file;

            if (!file)
            {
                res.status(400).json({ success: false, error: { code: 'MISSING_FILE', message: 'Chybí zdrojový obrázek' } });
                return;
            }

            const generation: Generation = {
                id: uuidv4(),
                success: true,
                promptType: 'image-to-video',
                instructions: instructions,
                duration: duration || 5,
                originalImage: `/assets/uploads/${file.filename}`,
                video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                timestamp: new Date(),
                userId: (req as any).user?.id || 'anonymous'
            };

            generationHistory.push(generation);
            res.json(generation);
        } catch (error)
        {
            logError('Error in imageToVideo', error as Error);
            next(error);
        }
    }

    // Video-to-Video
    public async videoToVideo (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { instructions } = req.body;
            const file = (req as any).file;

            if (!file)
            {
                res.status(400).json({ success: false, error: { code: 'MISSING_FILE', message: 'Chybí zdrojové video' } });
                return;
            }

            const generation: Generation = {
                id: uuidv4(),
                success: true,
                promptType: 'video-to-video',
                instructions: instructions,
                originalVideo: `/assets/uploads/${file.filename}`,
                video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                timestamp: new Date(),
                userId: (req as any).user?.id || 'anonymous'
            };

            generationHistory.push(generation);
            res.json(generation);
        } catch (error)
        {
            logError('Error in videoToVideo', error as Error);
            next(error);
        }
    }

    // Improve Prompt
    public async improvePrompt (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            const { originalPrompt, type } = req.body;

            if (!originalPrompt || typeof originalPrompt !== 'string' || originalPrompt.trim() === '')
            {
                res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Prázdný prompt' } });
                return;
            }

            let improvedPrompt = originalPrompt;

            try
            {
                const ollamaEndpoint = process.env.OLLAMA_API_URL || 'http://localhost:11434';
                const promptEnhanceRequest = `Vylepši následující prompt pro generování ${type === 'image' ? 'obrázku' : 'videa'}, aby obsahoval více detailů a vedl k lepším výsledkům: "${originalPrompt}"`;

                const ollamaResponse = await axios.post(`${ollamaEndpoint}/api/generate`, {
                    model: 'dolphin-mistral',
                    prompt: promptEnhanceRequest,
                    stream: false
                }, { timeout: 10000 }).catch(err => {
                    logInfo('Ollama API unavailable, using simulation');
                    return null;
                });

                if (ollamaResponse && ollamaResponse.data)
                {
                    improvedPrompt = ollamaResponse.data.response.replace(/^"/, '').replace(/"$/, '');
                }
            } catch (error)
            {
                logError('Error enhancing prompt', error as Error);
            }

            if (improvedPrompt === originalPrompt)
            {
                switch (type)
                {
                    case 'image':
                        improvedPrompt = `${originalPrompt}, vysoce detailní, 8k rozlišení, perfektní osvětlení, realistické stínování, vyvážená kompozice`;
                        break;
                    case 'video':
                        improvedPrompt = `${originalPrompt}, plynulý pohyb, 4k kvalita, stabilní záběr, cinematic lighting, vysoké fps`;
                        break;
                    default:
                        improvedPrompt = `${originalPrompt}, vylepšeno pro realističnost a detail`;
                }
            }

            res.json({
                success: true,
                originalPrompt,
                improvedPrompt
            });
        } catch (error)
        {
            logError('Error in improvePrompt', error as Error);
            next(error);
        }
    }

    // Get History
    public async getHistory (req: Request, res: Response, next: NextFunction): Promise<void> {
        try
        {
            res.json({
                success: true,
                history: generationHistory.slice(-10)
            });
        } catch (error)
        {
            logError('Error in getHistory', error as Error);
            next(error);
        }
    }
}

export const generationController = new GenerationController();
export default generationController;
