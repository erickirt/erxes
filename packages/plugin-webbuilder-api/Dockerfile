FROM node:18.20.4-bookworm-slim
WORKDIR /erxes
RUN chown -R node:node /erxes
RUN apt-get update -y \
    && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*
COPY --chown=node:node . .
USER node
ENTRYPOINT ["node", "--max_old_space_size=8192", "--max-http-header-size=16384", "packages/plugin-webbuilder-api/src/index"]