FROM node:lts-alpine3.10 as builder


WORKDIR /home/node/app

COPY package.json .
COPY package-lock.json .
COPY src src
COPY examples examples

EXPOSE 8080

ENV NODE_ENV=production
ENV HTTP_HOST=0.0.0.0
ENV HTTP_PORT=3000
RUN npm install

CMD npm start
