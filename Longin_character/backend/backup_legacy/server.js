// Hlavní serverový soubor
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// API Routes
app.use('/api', apiRoutes);

// Základní route pro test serveru
app.get('/', (req, res) => {
    res.json({ message: 'API serveru Longin charakter AI je funkční' });
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