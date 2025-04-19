FROM node:20-alpine

WORKDIR /app/frontend

COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

ENV VITE_PUBLIC_PATH=/
ENV VITE_HOST=0.0.0.0
ENV VITE_PORT=5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
