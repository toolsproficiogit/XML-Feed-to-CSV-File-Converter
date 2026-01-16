# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# === CHANGE THIS if your app folder differs ===
# If the app is in repo root, use:
# COPY package.json pnpm-lock.yaml* ./
# COPY . ./
#
# If the app is in subfolder, keep pattern below:
COPY xml-feed-to-csv-converter/package.json xml-feed-to-csv-converter/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY xml-feed-to-csv-converter/ ./

# Build (Vite usually outputs /dist)
RUN pnpm run build

# ---- Runtime stage ----
FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve

# Copy static build output
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
