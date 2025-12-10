FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN npm install

COPY public ./public
COPY src ./src
COPY tsconfig.json ./

RUN npm run build

FROM node:18-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=0 /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
