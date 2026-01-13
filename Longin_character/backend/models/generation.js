// Model pro generace mediálního obsahu
// V reálné aplikaci by toto byl Mongoose model nebo jiný databázový model
// V této simulaci používáme pouze základní strukturu objektu

class Generation {
    constructor(data) {
        this.id = data.id || Date.now().toString();
        this.success = data.success || true;
        this.promptType = data.promptType; // text-to-image, image-to-image, text-to-video, atd.
        this.prompt = data.prompt || '';
        this.instructions = data.instructions || '';
        this.originalImage = data.originalImage || null;
        this.originalVideo = data.originalVideo || null;
        this.image = data.image || null;
        this.video = data.video || null;
        this.duration = data.duration || null;
        this.timestamp = data.timestamp || new Date();
        this.userId = data.userId || 'anonymous'; // Pro budoucí autentizaci
    }
}

module.exports = Generation;