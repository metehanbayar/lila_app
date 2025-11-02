# Backend Dockerfile - Node.js Express API
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem paketlerini güncelle ve gerekli paketleri yükle
RUN apk update && apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci --only=production && npm cache clean --force

# Uygulama dosyalarını kopyala
COPY . .

# Uploads dizinini oluştur ve izinleri ayarla
RUN mkdir -p uploads temp && \
    chown -R node:node uploads temp

# Non-root user olarak çalıştır (güvenlik)
USER node

# Port'u expose et
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Uygulamayı başlat
CMD ["node", "server.js"]
