FROM --platform=linux/amd64 node:22-alpine

WORKDIR /app

ENV LITERAL_API_URL="https://cloud.getliteral.ai"
ENV LITERAL_API_KEY="lsk_xxxx"
ENV OPENAI_API_KEY="sk-proj-xxxx"

COPY ./public ./public
COPY ./package.json ./package.json
COPY ./.next/standalone ./
COPY ./.next/static ./.next/static

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
