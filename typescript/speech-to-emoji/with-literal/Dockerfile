FROM --platform=linux/amd64 node:22-alpine

WORKDIR /app

COPY ./public ./public
COPY ./package.json ./package.json
COPY ./.next/standalone ./
COPY ./.next/static ./.next/static

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
