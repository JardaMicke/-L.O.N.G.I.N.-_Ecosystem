# Etapa pro build
FROM node:18-alpine as build

WORKDIR /app

# Kopírování souborů package.json a package-lock.json
COPY package*.json ./

# Instalace závislostí
RUN npm install

# Kopírování zdrojových souborů
COPY . .

# Build aplikace
RUN npm run build

# Produkční etapa
FROM nginx:alpine

# Kopírování buildu z předchozí etapy
COPY --from=build /app/build /usr/share/nginx/html

# Kopírování nginx konfigurace
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponování portu
EXPOSE 80

# Spuštění nginx
CMD ["nginx", "-g", "daemon off;"]