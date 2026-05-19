FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata

ENV TZ=Africa/Nairobi

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8003

CMD ["node", "-r", "ts-node/register", "src/index.ts"]