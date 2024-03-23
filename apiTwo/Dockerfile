FROM node:alpine

WORKDIR /api2

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
