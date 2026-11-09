FROM node:22-alpine
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/api-server/package.json apps/api-server/
COPY apps/ingestion-worker/package.json apps/ingestion-worker/
COPY apps/web/package.json apps/web/
COPY apps/simulator/package.json apps/simulator/
RUN npm install --workspace ingestion-worker
COPY apps/ingestion-worker apps/ingestion-worker
WORKDIR /repo/apps/ingestion-worker
RUN npx tsc --pretty false
CMD ["node", "dist/main.js"]
