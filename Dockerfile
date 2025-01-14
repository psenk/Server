# base image
FROM node:18-slim

# set directory
WORKDIR /app

# copy package json files
COPY package*.json ./

# install dependencies
RUN npm install

# copy source code
COPY . .

# expose port
EXPOSE 3000

# start app
CMD ["node", "index.js"]
