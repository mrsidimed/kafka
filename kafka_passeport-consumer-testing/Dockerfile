# Use the official Node.js runtime as a base image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the app source code into the container
COPY . .

# Expose the app port
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "start"]