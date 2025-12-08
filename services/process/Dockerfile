# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.18

# ---- 1. Build Common Package (shared stage) ----
FROM node:${NODE_VERSION}-alpine AS common-builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Copy root workspace files
COPY ./package.json ./
COPY ./tsconfig.base.json ./
COPY ./tsconfig.eslint.json ./

# Copy eslint config and .gitignore (needed for eslint during build)
COPY ./eslint.config.mjs ./
COPY ./.gitignore ./

# Copy the common shared package
COPY services/common ./services/common

# Copy ALL service package.json files so common-builder stage is identical across all services
# This allows Docker BuildKit to share this stage and build common package only once
COPY services/api-gateway/package.json ./services/api-gateway/package.json
COPY services/agent/package.json ./services/agent/package.json
COPY services/process/package.json ./services/process/package.json



# Copy package-lock.json if it exists
COPY ./package-lock.json* ./

# Install all dependencies from root (includes ALL workspace dependencies)
# Use cache mount to speed up npm install
# If npm ci fails (lock file out of sync), fall back to npm install
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
        npm ci || npm install; \
    else \
        npm install; \
    fi

# Build common package ONCE
WORKDIR /build/services/common
RUN npm run build

# ---- 2. Service Builder Stage ----
FROM node:${NODE_VERSION}-alpine AS service-builder

# Install build dependencies
# RUN apk add --no-cache python3 make g++

WORKDIR /build

# Copy root files
COPY ./package.json ./
COPY ./tsconfig.base.json ./
COPY ./package-lock.json* ./

# Copy node_modules from common-builder (already has all deps installed)
COPY --from=common-builder /build/node_modules ./node_modules

# Copy the built common package
COPY --from=common-builder /build/services/common ./services/common

# Copy the Process Service files
COPY services/process ./services/process

# Build the Process Service (common package is already built)
WORKDIR /build/services/process
RUN rm -rf dist
RUN npm run build

# ---- 3. Runtime Stage ----
FROM node:${NODE_VERSION}-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Copy root node_modules (includes all workspace dependencies)
COPY --from=service-builder /build/node_modules ./node_modules

# Copy common package (built)
COPY --from=common-builder /build/services/common ./node_modules/@part-iot/common

# Copy Process Service files
COPY --from=service-builder /build/services/process/package.json ./
COPY --from=service-builder /build/services/process/dist ./dist

CMD ["node", "dist/src/main.js"]
