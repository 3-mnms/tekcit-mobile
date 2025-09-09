# React 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# 의존성 설치
RUN npm ci --prefer-offline --no-audit --no-fund
COPY . .

# env.js 생성
RUN mkdir -p /usr/share/nginx/html/public && \
    if [ ! -f /usr/share/nginx/html/public/env.js ]; then \
      printf 'window.__ENV__ = {\n' \
             '  API_URL: "",\n' \
             '  VITE_PORTONE_STORE_ID: "",\n' \
             '  VITE_PORTONE_CHANNEL_KEY: ""\n' \
             '};\n' > /usr/share/nginx/html/public/env.js; \
    fi

# build ( nginx client 와 맞춤 )
RUN npx vite build


# Nginx 배포
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
# nginx conf 설정은 Helm Chart에서 설정
CMD ["nginx","-g","daemon off;"]