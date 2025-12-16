# Stage 1: Build the React Application
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies (cache optimized)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
# Note: wasm-pack build output is assumed to be committed or generated within npm run build
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
