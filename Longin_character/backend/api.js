// Backend API pro Media Generator
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Nastavení pro ukládání souborů
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../assets/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueFilename = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Databáze generací (v produkci by toto byl MongoDB nebo jiná DB)
const generationHistory = [];

// API Endpointy
app.post('/api/text-to-image', (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt || prompt.trim() === '') {
        return res.status(400).json({ success: false, message: 'Prázdný prompt' });
    }
    
    // Logika pro generování obrázku (simulace)
    setTimeout(() => {
        const imageId = Math.floor(Math.random() * 9) + 1;
        const imagePath = `/app/user_site/src/${['4vm1b8i0b4.jpg', '7lhd4fax9q.jpg', 'ay6vzj7rj5.jpg', 'e5226mwzet.jpg', 'g2kbjg12a3.jpg', 'k2sfv7vkwl.jpg', 'll3ggouf6p.jpg', 'n3xhmjp8lh.jpg', 'ulv6ynlxw3.jpg'][imageId-1]}`;
        
        // Kopírování náhodného obrázku do assets/images
        const fileName = `generated_${Date.now()}.jpg`;
        const destinationPath = path.join(__dirname, '../assets/images', fileName);
        
        fs.copyFile(imagePath, destinationPath, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Chyba při generování obrázku' });
            }
            
            const result = {
                success: true,
                image: `/assets/images/${fileName}`,
                timestamp: new Date(),
                promptType: 'text-to-image',
                prompt: prompt
            };
            
            generationHistory.push(result);
            res.json(result);
        });
    }, 2000); // Simulace zpracování
});

app.post('/api/image-to-image', upload.single('sourceImage'), (req, res) => {
    const { instructions } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Chybí zdrojový obrázek' });
    }
    
    // Logika pro transformaci obrázku (simulace)
    setTimeout(() => {
        const imageId = Math.floor(Math.random() * 9) + 1;
        const imagePath = `/app/user_site/src/${['4vm1b8i0b4.jpg', '7lhd4fax9q.jpg', 'ay6vzj7rj5.jpg', 'e5226mwzet.jpg', 'g2kbjg12a3.jpg', 'k2sfv7vkwl.jpg', 'll3ggouf6p.jpg', 'n3xhmjp8lh.jpg', 'ulv6ynlxw3.jpg'][imageId-1]}`;
        
        // Kopírování náhodného obrázku do assets/images
        const fileName = `transformed_${Date.now()}.jpg`;
        const destinationPath = path.join(__dirname, '../assets/images', fileName);
        
        fs.copyFile(imagePath, destinationPath, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Chyba při transformaci obrázku' });
            }
            
            const result = {
                success: true,
                image: `/assets/images/${fileName}`,
                originalImage: `/assets/uploads/${req.file.filename}`,
                timestamp: new Date(),
                promptType: 'image-to-image',
                instructions: instructions
            };
            
            generationHistory.push(result);
            res.json(result);
        });
    }, 3000); // Simulace zpracování
});

app.post('/api/text-to-video', (req, res) => {
    const { prompt, duration } = req.body;
    
    if (!prompt || prompt.trim() === '') {
        return res.status(400).json({ success: false, message: 'Prázdný prompt' });
    }
    
    // Logika pro generování videa (simulace)
    setTimeout(() => {
        const result = {
            success: true,
            video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
            timestamp: new Date(),
            promptType: 'text-to-video',
            prompt: prompt,
            duration: duration || 5
        };
        
        generationHistory.push(result);
        res.json(result);
    }, 4000); // Simulace zpracování
});

app.post('/api/image-to-video', upload.single('sourceImage'), (req, res) => {
    const { instructions, duration } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Chybí zdrojový obrázek' });
    }
    
    // Logika pro animaci obrázku (simulace)
    setTimeout(() => {
        const result = {
            success: true,
            video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
            originalImage: `/assets/uploads/${req.file.filename}`,
            timestamp: new Date(),
            promptType: 'image-to-video',
            instructions: instructions,
            duration: duration || 5
        };
        
        generationHistory.push(result);
        res.json(result);
    }, 5000); // Simulace zpracování
});

app.post('/api/video-to-video', upload.single('sourceVideo'), (req, res) => {
    const { instructions } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Chybí zdrojové video' });
    }
    
    // Logika pro transformaci videa (simulace)
    setTimeout(() => {
        const result = {
            success: true,
            video: 'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder
            originalVideo: `/assets/uploads/${req.file.filename}`,
            timestamp: new Date(),
            promptType: 'video-to-video',
            instructions: instructions
        };
        
        generationHistory.push(result);
        res.json(result);
    }, 6000); // Simulace zpracování
});

// API pro vylepšení promptu
app.post('/api/improve-prompt', (req, res) => {
    const { originalPrompt, type } = req.body;
    
    if (!originalPrompt || originalPrompt.trim() === '') {
        return res.status(400).json({ success: false, message: 'Prázdný prompt' });
    }
    
    // Logika pro vylepšení promptu (simulace)
    setTimeout(() => {
        let improvedPrompt = originalPrompt;
        
        // Různé vylepšení podle typu média
        switch(type) {
            case 'image':
                improvedPrompt += ", vysoce detailní, 8k rozlišení, perfektní osvětlení, realistické stínování, vyvážená kompozice";
                break;
            case 'video':
                improvedPrompt += ", plynulý pohyb, 4k kvalita, stabilní záběr, cinematic lighting, vysoké fps";
                break;
            default:
                improvedPrompt += ", vylepšeno pro realističnost a detail";
        }
        
        res.json({
            success: true,
            originalPrompt,
            improvedPrompt
        });
    }, 1000); // Simulace zpracování
});

// API pro získání historie generací
app.get('/api/history', (req, res) => {
    res.json({
        success: true,
        history: generationHistory.slice(-10) // Posledních 10 generací
    });
});

// Spuštění serveru
app.listen(port, () => {
    console.log(`Server běží na portu ${port}`);
    
    // Vytvoření adresáře pro uploady, pokud neexistuje
    const uploadsDir = path.join(__dirname, '../assets/uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Vytvoření adresáře pro generované obrázky, pokud neexistuje
    const imagesDir = path.join(__dirname, '../assets/images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }
});

module.exports = app;