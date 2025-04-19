FROM node:20-alpine

WORKDIR /app/frontend

COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "run", "build"]
