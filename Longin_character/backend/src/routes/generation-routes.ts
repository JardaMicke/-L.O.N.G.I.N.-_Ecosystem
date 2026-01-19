/**
 * Generation Routes
 * API endpoints for content generation
 * @module routes/generation-routes
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { generationController } from '../controllers/generation-controller';

const router = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Adjust path to assets/uploads (3 levels up from src/routes -> Longin_character)
        const uploadPath = path.join(__dirname, '../../../assets/uploads');
        // Ensure directory requires existence? Standard multer doesn't create it. 
        // We will assume it exists or rely on controller to handle file path creation later, 
        // but multer saves BEFORE controller. 
        // Ideally we should check/create here if we want robustness, but for migration sticking to logic.
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueFilename = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueFilename);
    }
});

const upload = multer({ storage: storage });

// Text-to-Image endpoint
router.post('/text-to-image', (req, res, next) => generationController.textToImage(req, res, next));

// Image-to-Image endpoint
router.post('/image-to-image', upload.single('sourceImage'), (req, res, next) => generationController.imageToImage(req, res, next));

// Text-to-Video endpoint
router.post('/text-to-video', (req, res, next) => generationController.textToVideo(req, res, next));

// Image-to-Video endpoint
router.post('/image-to-video', upload.single('sourceImage'), (req, res, next) => generationController.imageToVideo(req, res, next));

// Video-to-Video endpoint
router.post('/video-to-video', upload.single('sourceVideo'), (req, res, next) => generationController.videoToVideo(req, res, next));

// Improve prompt
router.post('/improve-prompt', (req, res, next) => generationController.improvePrompt(req, res, next));

// History
router.get('/history', (req, res, next) => generationController.getHistory(req, res, next));

export default router;
