FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata

ENV TZ=Africa/Nairobi

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3003

CMD ["npm", "run", "start:dev"]