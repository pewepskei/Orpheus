# Use Node.js base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Optional: install git if your deps need it
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Install Angular CLI globally
RUN npm install -g @angular/cli@20.0.5

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose Angular dev server port
EXPOSE 4200

# Start the Angular app using ng serve
CMD ["ng", "serve", "--host", "0.0.0.0"]

