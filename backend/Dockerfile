# Backend ControlMax — imagem para Cloud Run (ENT-06)
# Build context: pasta `backend/`
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY *.ts ./
COPY middleware ./middleware
COPY schemas ./schemas
COPY services ./services

RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV CLOUD_RUN=true

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

USER node
CMD ["node", "dist/server.js"]
