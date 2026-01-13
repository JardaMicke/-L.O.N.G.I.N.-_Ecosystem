FROM node:18-alpine

WORKDIR /app

# Kopírování souborů package.json a package-lock.json
COPY package*.json ./

# Instalace závislostí
RUN npm install

# Kopírování zdrojových souborů
COPY . .

# Vytvoření adresářů pro uploady a obrázky
RUN mkdir -p ../assets/uploads ../assets/images

# Exponování portu
EXPOSE 3000

# Spuštění aplikace
CMD ["node", "server.js"]