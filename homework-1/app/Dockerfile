FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
COPY package.json server.js ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["node", "server.js"]
