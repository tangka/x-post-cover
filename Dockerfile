FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

ENV CHROME=/usr/bin/chromium

WORKDIR /app

COPY dist/       ./dist/
COPY public/     ./public/
COPY .env.example ./.env.example

CMD ["sh", "-c", "while true; do node dist/monitor/index.js; sleep 1800; done"]
