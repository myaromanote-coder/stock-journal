FROM node:20-slim AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/src/ ./src/
COPY --from=frontend-builder /app/client/dist ./public
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/index.js"]
