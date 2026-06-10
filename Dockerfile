# ILAtech Growth Intelligence — container build.
# Official Node 22 image (node:sqlite requires >=22.5; this app has ZERO npm dependencies).
FROM node:22-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production
# Railway injects PORT (the app reads process.env.PORT). Data dir is set via the XL_DATA_DIR env var.
CMD ["node", "--experimental-sqlite", "server.js"]
