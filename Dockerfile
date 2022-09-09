FROM node:alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json .
RUN yarn
COPY . .
RUN npx tsc
CMD ["node", "./dist/src/index.js"]
