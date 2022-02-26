FROM node:alpine

# Install yarn and other dependencies via apk
RUN apk update
RUN apk add --no-cache \
    build-base \
    g++ \
    make \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

# set up directory structure
RUN mkdir /app
WORKDIR /app

# set up packages
# RUN npm install -g yarn
RUN npm install -g nodemon
COPY package.json .
COPY package-lock.json .
RUN npm install

# copy over the rest
COPY . .

# compile src
RUN npx tsc

# run the app
EXPOSE 3000
# CMD sh
CMD [ "nodemon", "lib/index.js" ]
