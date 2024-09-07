FROM ubuntu:latest

WORKDIR /app

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get install -y dos2unix && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install --save-dev hardhat

ENV NETWORK=proxy

RUN dos2unix entrypoint.sh && chmod +x entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
