# SentinelPay - Multi-Stage React Frontend Dockerfile

# Stage 1: Build production bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build production bundle with Tailwind CSS
RUN npm run build

# Stage 2: Serve using lightweight Nginx
FROM nginx:alpine

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
