# Stage 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run the server
FROM node:20-alpine
WORKDIR /app
COPY server/package.json ./server/
RUN cd server && npm install --omit=dev
COPY server/ ./server/
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "server/index.js"]
