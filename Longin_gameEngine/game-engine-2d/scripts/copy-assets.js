const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../public');
const destDir = path.join(__dirname, '../dist/public');

// Ensure destination directory exists
if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

function copyDir(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)){
                fs.mkdirSync(destPath);
            }
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${entry.name}`);
        }
    }
}

try {
    console.log(`Copying assets from ${srcDir} to ${destDir}...`);
    copyDir(srcDir, destDir);
    console.log('Assets copied successfully!');
} catch (err) {
    console.error('Error copying assets:', err);
    process.exit(1);
}
