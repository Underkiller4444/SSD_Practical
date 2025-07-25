FROM node:20

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# App directory
WORKDIR /app

# Copy files
COPY package*.json ./
COPY server.js ./
COPY views/ ./views/

# Install dependencies with security flags
RUN npm install --ignore-scripts --only=production

# Copy only necessary application files
COPY public/ ./public/
COPY *.js ./
COPY *.json ./
COPY *.txt ./

# Change ownership of the app directory to the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose port and start app
EXPOSE 8080
CMD ["npm", "start"]
