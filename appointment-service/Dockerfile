FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY src/ ./src/
RUN mkdir -p /app/data
EXPOSE 50052
CMD ["node", "src/index.js"]