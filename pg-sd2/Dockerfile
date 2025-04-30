# Use a specific LTS Node.js image (more stable than :latest)
FROM node:18-alpine

# Set working directory
WORKDIR /src

# Copy only package files to leverage Docker cache for layer reuse
COPY package*.json ./

# Install dependencies globally and locally
RUN npm install -g supervisor \
  && npm install \
  && npm cache clean --force

# Copy the rest of the project files
COPY . .

# Expose the app's port
EXPOSE 3000

# Run the app
CMD ["supervisor", "index.js"]
