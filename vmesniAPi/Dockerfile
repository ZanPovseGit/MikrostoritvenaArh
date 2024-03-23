# Use the official Node.js image as a base
FROM node:alpine

# Set the working directory inside the container
WORKDIR /autentik

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 3030

# Command to run your application
CMD ["node", "vmesnik.js"]
