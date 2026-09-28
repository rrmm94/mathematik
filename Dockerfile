# ---- Oberfläche bauen ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Laufzeit ----
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY shared ./shared
COPY --from=build /app/dist ./dist
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/me >/dev/null || exit 1
CMD ["node", "--no-warnings", "server/index.js"]
