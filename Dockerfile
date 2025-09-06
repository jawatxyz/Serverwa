# Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm install --production

# Copy rest of files
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
