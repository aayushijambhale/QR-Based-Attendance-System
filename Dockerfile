FROM node:20

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend client and Server source bundles
RUN npm run build

# Expose port 7860 (Hugging Face Spaces default requirement)
EXPOSE 7860

# Define default PORT environment variable for the process to bind to
ENV PORT=7860

# Start server
CMD ["npm", "start"]
