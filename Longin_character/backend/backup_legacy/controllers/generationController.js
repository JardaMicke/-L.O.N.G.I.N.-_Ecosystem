// Controller pro generování mediálního obsahu
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Generation = require('../models/generation');
const axios = require('axios');

// Databáze generací (v produkci by toto byl MongoDB nebo jiná DB)
const generationHistory = [];

// Pomocná funkce pro simulaci generování obrázku
const generateImage = (sourcePath, fileName) => {
    return new Promise((resolve, reject) => {
        try {
            // Kopírovat náhodný obrázek jako výsledek
            const destinationPath = path.join(__dirname, '../../assets/images', fileName);
            fs.copyFile(sourcePath, destinationPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(`/assets/images/${fileName}`);
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Kontrolery API
module.exports = {
    // Text-to-Image generátor
    textToImage: async (req, res) => {
        try {
            const { prompt } = req.body;
            
            if (!prompt || prompt.trim() === '') {
                return res.status(400).json({ success: false, message: 'Prázdný prompt' });
            }
            
            // Pokusíme se použít Stable Diffusion API, pokud je dostupné
            let imagePath = null;
            
            try {
                const sdEndpoint = process.env.COMFYUI_API_URL || 'http://localhost:7860';
                
                const sdResponse = await axios.post(`${sdEndpoint}/sdapi/v1/txt2img`, {
                    prompt: prompt,
                    negative_prompt: 'blurry, low quality, low resolution',
                    width: 512,
                    height: 512,
                    steps: 20
                }).catch(err => {
                    console.log('Stable Diffusion API není dostupné, používám simulaci:', err.message);
                    return null;
                });
                
                if (sdResponse && sdResponse.data && sdResponse.data.images && sdResponse.data.images.length > 0) {
                    // Uložíme vygenerovaný obrázek
                    const imageBase64 = sdResponse.data.images[0];
                    const imageBuffer = Buffer.from(imageBase64, 'base64');
                    const fileName = `generated_${Date.now()}.png`;
                    const filePath = path.join(__dirname, '../../assets/images', fileName);
                    
                    fs.writeFileSync(filePath, imageBuffer);
                    imagePath = `/assets/images/${fileName}`;
                }
            } catch (error) {
                console.error('Chyba při komunikaci se Stable Diffusion API:', error);
                // Pokračujeme se simulací
            }
            
            // Pokud se nepodařilo vygenerovat obrázek přes API, použijeme simulaci
            if (!imagePath) {
                // Simulace zpracování generování obrázku
                const imageId = Math.floor(Math.random() * 9) + 1;
                const imageSources = ['4vm1b8i0b4.jpg', '7lhd4fax9q.jpg', 'ay6vzj7rj5.jpg', 'e5226mwzet.jpg', 'g2kbjg12a3.jpg', 'k2sfv7vkwl.jpg', 'll3ggouf6p.jpg', 'n3xhmjp8lh.jpg', 'ulv6ynlxw3.jpg'];
                const sourcePath = path.join(__dirname, '../..', imageSources[imageId-1]);
                const fileName = `generated_${Date.now()}.jpg`;
                
                imagePath = await generateImage(sourcePath, fileName);
            }
            
            const generation = new Generation({
                promptType: 'text-to-image',
                prompt: prompt,
                image: imagePath,
                timestamp: new Date()
            });
            
            generationHistory.push(generation);
            res.json(generation);
            
        } catch (error) {
            console.error('Error in textToImage:', error);
            res.status(500).json({ success: false, message: 'Chyba při generování obrázku', error: error.message });
        }
    },
    
    // Image-to-Image transformátor
    imageToImage: async (req, res) => {
        try {
            const { instructions } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Chybí zdrojový obrázek' });
            }
            
            // Pokusíme se použít Stable Diffusion API, pokud je dostupné
            let imagePath = null;
            
            try {
                const sdEndpoint = process.env.COMFYUI_API_URL || 'http://localhost:7860';
                
                // Nejprve musíme konvertovat nahraný obrázek na base64
                const imageBuffer = fs.readFileSync(req.file.path);
                const imageBase64 = imageBuffer.toString('base64');
                
                const sdResponse = await axios.post(`${sdEndpoint}/sdapi/v1/img2img`, {
                    init_images: [imageBase64],
                    prompt: instructions || 'enhance, detailed',
                    negative_prompt: 'blurry, low quality',
                    denoising_strength: 0.75,
                    steps: 20
                }).catch(err => {
                    console.log('Stable Diffusion API není dostupné, používám simulaci:', err.message);
                    return null;
                });
                
                if (sdResponse && sdResponse.data && sdResponse.data.images && sdResponse.data.images.length > 0) {
                    // Uložíme vygenerovaný obrázek
                    const resultImageBase64 = sdResponse.data.images[0];
                    const resultImageBuffer = Buffer.from(resultImageBase64, 'base64');
                    const fileName = `transformed_${Date.now()}.png`;
                    const filePath = path.join(__dirname, '../../assets/images', fileName);
                    
                    fs.writeFileSync(filePath, resultImageBuffer);
                    imagePath = `/assets/images/${fileName}`;
                }
            } catch (error) {
                console.error('Chyba při komunikaci se Stable Diffusion API:', error);
                // Pokračujeme se simulací
            }
            
            // Pokud se nepodařilo vygenerovat obrázek přes API, použijeme simulaci
            if (!imagePath) {
                // Simulace zpracování transformace obrázku
                const imageId = Math.floor(Math.random() * 9) + 1;
                const imageSources = ['4vm1b8i0b4.jpg', '7lhd4fax9q.jpg', 'ay6vzj7rj5.jpg', 'e5226mwzet.jpg', 'g2kbjg12a3.jpg', 'k2sfv7vkwl.jpg', 'll3ggouf6p.jpg', 'n3xhmjp8lh.jpg', 'ulv6ynlxw3.jpg'];
                const sourcePath = path.join(__dirname, '../..', imageSources[imageId-1]);
                const fileName = `transformed_${Date.now()}.jpg`;
                
                imagePath = await generateImage(sourcePath, fileName);
            }
            
            const generation = new Generation({
                promptType: 'image-to-image',
                instructions: instructions,
                originalImage: `/assets/uploads/${req.file.filename}`,
                image: imagePath,
                timestamp: new Date()
            });
            
            generationHistory.push(generation);
            res.json(generation);
            
        } catch (error) {
            console.error('Error in imageToImage:', error);
            res.status(500).json({ success: false, message: 'Chyba při transformaci obrázku', error: error.message });
        }
    },
    
    // Text-to-Video generátor
    textToVideo: async (req, res) => {
        try {
            const { prompt, duration } = req.body;
            
            if (!prompt || prompt.trim() === '') {
                return res.status(400).json({ success: false, message: 'Prázdný prompt' });
            }
            
            // Simulace generování videa
            const generation = new Generation({
                promptType: 'text-to-video',
                prompt: prompt,
                duration: duration || 5,
                video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
                timestamp: new Date()
            });
            
            generationHistory.push(generation);
            res.json(generation);
            
        } catch (error) {
            console.error('Error in textToVideo:', error);
            res.status(500).json({ success: false, message: 'Chyba při generování videa', error: error.message });
        }
    },
    
    // Image-to-Video animátor
    imageToVideo: async (req, res) => {
        try {
            const { instructions, duration } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Chybí zdrojový obrázek' });
            }
            
            // Simulace animace obrázku
            const generation = new Generation({
                promptType: 'image-to-video',
                instructions: instructions,
                duration: duration || 5,
                originalImage: `/assets/uploads/${req.file.filename}`,
                video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
                timestamp: new Date()
            });
            
            generationHistory.push(generation);
            res.json(generation);
            
        } catch (error) {
            console.error('Error in imageToVideo:', error);
            res.status(500).json({ success: false, message: 'Chyba při animaci obrázku', error: error.message });
        }
    },
    
    // Video-to-Video transformátor
    videoToVideo: async (req, res) => {
        try {
            const { instructions } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Chybí zdrojové video' });
            }
            
            // Simulace transformace videa
            const generation = new Generation({
                promptType: 'video-to-video',
                instructions: instructions,
                originalVideo: `/assets/uploads/${req.file.filename}`,
                video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
                timestamp: new Date()
            });
            
            generationHistory.push(generation);
            res.json(generation);
            
        } catch (error) {
            console.error('Error in videoToVideo:', error);
            res.status(500).json({ success: false, message: 'Chyba při transformaci videa', error: error.message });
        }
    },
    
    // Vylepšení promptu
    improvePrompt: async (req, res) => {
        try {
            const { originalPrompt, type } = req.body;
            
            if (!originalPrompt || originalPrompt.trim() === '') {
                return res.status(400).json({ success: false, message: 'Prázdný prompt' });
            }
            
            // Pokusíme se použít LLM API pro vylepšení promptu
            let improvedPrompt = originalPrompt;
            
            try {
                const ollamaEndpoint = process.env.OLLAMA_API_URL || 'http://localhost:11434';
                
                const promptEnhanceRequest = `Vylepši následující prompt pro generování ${type === 'image' ? 'obrázku' : 'videa'}, aby obsahoval více detailů a vedl k lepším výsledkům: "${originalPrompt}"`;
                
                const ollamaResponse = await axios.post(`${ollamaEndpoint}/api/generate`, {
                    model: 'dolphin-mistral',
                    prompt: promptEnhanceRequest,
                    stream: false
                }).catch(err => {
                    console.log('Ollama API není dostupné, používám simulaci:', err.message);
                    return null;
                });
                
                if (ollamaResponse && ollamaResponse.data) {
                    improvedPrompt = ollamaResponse.data.response.replace(/^"/, '').replace(/"$/, '');
                }
            } catch (error) {
                console.error('Chyba při komunikaci s Ollama API:', error);
                // Fallback na základní vylepšení
            }
            
            // Pokud se nepodařilo vylepšit prompt přes API, použijeme základní vylepšení
            if (improvedPrompt === originalPrompt) {
                // Logika pro vylepšení promptu podle typu
                switch(type) {
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
            
        } catch (error) {
            console.error('Error in improvePrompt:', error);
            res.status(500).json({ success: false, message: 'Chyba při vylepšování promptu', error: error.message });
        }
    },
    
    // Získání historie generací
    getHistory: async (req, res) => {
        try {
            res.json({
                success: true,
                history: generationHistory.slice(-10) // Posledních 10 generací
            });
        } catch (error) {
            console.error('Error in getHistory:', error);
            res.status(500).json({ success: false, message: 'Chyba při získávání historie', error: error.message });
        }
    }
};