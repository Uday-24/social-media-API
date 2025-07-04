FROM node

WORKDIR /app

ENV NODE_ENV=development


RUN npm install -g nodemon
COPY package*.json ./
RUN npm install

# Don't COPY . . here, let volume handle it

EXPOSE 5000

CMD [ "npm", "run", "dev" ]