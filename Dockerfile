FROM node:lts-alpine3.12
MAINTAINER Aditya Mittal 'email.aditya.mittal@gmail.com'
WORKDIR /opt/app
COPY package*.json ./
RUN npm install --production --unsafe-perm
COPY ./src ./src
ENV NODE_ENV production
CMD ["npm", "start"]