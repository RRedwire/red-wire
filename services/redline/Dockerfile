FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["node", "server.js"]
