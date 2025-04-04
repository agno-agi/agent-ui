FROM node:22-alpine

COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build

CMD ["npm", "run", "start"]
