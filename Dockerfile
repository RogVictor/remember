FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json ./
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat
COPY --from=builder /app ./
RUN mkdir -p /app/media && chown -R node:node /app/media
USER node
EXPOSE 3000
CMD ["sh", "-c", "case \"$PAYLOAD_SECRET\" in \"\"|replace-*) echo 'ERROR: set a unique PAYLOAD_SECRET in .env before starting production.' >&2; exit 1 ;; esac; if [ \"${#PAYLOAD_SECRET}\" -lt 32 ]; then echo 'ERROR: PAYLOAD_SECRET must be at least 32 characters.' >&2; exit 1; fi; npm run start"]
