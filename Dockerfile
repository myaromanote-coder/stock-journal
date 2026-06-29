# Stage 1: React 빌드
FROM node:20-slim AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: 프로덕션 이미지
FROM node:20-slim
WORKDIR /app

# 서버 의존성 설치
COPY server/package*.json ./
RUN npm ci --omit=dev

# 서버 소스 복사
COPY server/src/ ./src/

# 빌드된 프론트엔드 복사
COPY --from=frontend-builder /app/client/dist ./public

# 데이터 디렉토리 생성
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DB_PATH=/data/stock-journal.db
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/index.js"]
