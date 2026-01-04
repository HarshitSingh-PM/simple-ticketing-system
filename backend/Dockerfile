FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install && npm rebuild bcrypt --build-from-source

COPY . .

RUN npm run build

EXPOSE 5001

CMD ["npm", "start"]
