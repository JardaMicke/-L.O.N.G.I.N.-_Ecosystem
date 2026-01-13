// API router
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const generationController = require('../controllers/generationController');
const chatController = require('../controllers/chatController');

// Nastavení pro ukládání souborů
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../assets/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueFilename = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage: storage });

// Text-to-Image endpoint
router.post('/text-to-image', generationController.textToImage);

// Image-to-Image endpoint
router.post('/image-to-image', upload.single('sourceImage'), generationController.imageToImage);

// Text-to-Video endpoint
router.post('/text-to-video', generationController.textToVideo);

// Image-to-Video endpoint
router.post('/image-to-video', upload.single('sourceImage'), generationController.imageToVideo);

// Video-to-Video endpoint
router.post('/video-to-video', upload.single('sourceVideo'), generationController.videoToVideo);

// Vylepšení promptu
router.post('/improve-prompt', generationController.improvePrompt);

// Historie generací
router.get('/history', generationController.getHistory);

// Chat API
router.post('/chat', chatController.generateResponse);

// Kontrola zdraví API
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        version: '1.0.0'
    });
});

module.exports = router;