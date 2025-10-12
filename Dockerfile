FROM node:22.13.1

WORKDIR /app

COPY package.json .

COPY package-lock.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD npx drizzle-kit push --force && npm start
