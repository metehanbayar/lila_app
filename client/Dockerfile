# Frontend Dockerfile - Multi-stage build
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Build argümanı olarak API URL al
ARG VITE_API_URL=/api

# Environment variable olarak ayarla
ENV VITE_API_URL=${VITE_API_URL}

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Kaynak kodları kopyala
COPY . .

# Build et
RUN npm run build

# Stage 2: Production - Nginx ile serve et
FROM nginx:alpine

# Nginx konfigürasyonunu kopyala
COPY docker-nginx.conf /etc/nginx/conf.d/default.conf

# Build edilmiş dosyaları kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# 404 ve diğer hatalar için index.html'e yönlendir (SPA routing için)
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
