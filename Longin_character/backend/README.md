# Backend pro Kreativní Média Generator

Tento backend poskytuje API pro webovou aplikaci Kreativní Média Generator.

## Instalace

```bash
cd backend
npm install
```

## Spuštění

Pro vývojové prostředí:
```bash
npm run dev
```

Pro produkční prostředí:
```bash
npm start
```

## API Endpointy

### Text-to-Image
- **POST /api/text-to-image**
  - Request: `{ "prompt": "text popisující obrázek" }`
  - Response: `{ "success": true, "image": "cesta/k/obrázku.jpg", "timestamp": "datum", "promptType": "text-to-image", "prompt": "původní prompt" }`

### Image-to-Image
- **POST /api/image-to-image**
  - Request: FormData s `sourceImage` (soubor) a `instructions` (text)
  - Response: `{ "success": true, "image": "cesta/k/obrázku.jpg", "originalImage": "cesta/k/původnímu.jpg", "timestamp": "datum", "promptType": "image-to-image", "instructions": "pokyny" }`

### Text-to-Video
- **POST /api/text-to-video**
  - Request: `{ "prompt": "text popisující video", "duration": počet_sekund }`
  - Response: `{ "success": true, "video": "url/k/videu.mp4", "timestamp": "datum", "promptType": "text-to-video", "prompt": "původní prompt", "duration": počet_sekund }`

### Image-to-Video
- **POST /api/image-to-video**
  - Request: FormData s `sourceImage` (soubor), `instructions` (text) a `duration` (číslo)
  - Response: `{ "success": true, "video": "url/k/videu.mp4", "originalImage": "cesta/k/obrázku.jpg", "timestamp": "datum", "promptType": "image-to-video", "instructions": "pokyny", "duration": počet_sekund }`

### Video-to-Video
- **POST /api/video-to-video**
  - Request: FormData s `sourceVideo` (soubor) a `instructions` (text)
  - Response: `{ "success": true, "video": "url/k/videu.mp4", "originalVideo": "cesta/k/videu.mp4", "timestamp": "datum", "promptType": "video-to-video", "instructions": "pokyny" }`

### Vylepšení promptu
- **POST /api/improve-prompt**
  - Request: `{ "originalPrompt": "text k vylepšení", "type": "image" nebo "video" }`
  - Response: `{ "success": true, "originalPrompt": "původní text", "improvedPrompt": "vylepšený text" }`

### Historie generací
- **GET /api/history**
  - Response: `{ "success": true, "history": [seznam posledních generací] }`