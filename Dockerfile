FROM node:26-alpine AS builder
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copia o restante do código
COPY . .

# Carrega a variável DATABASE_URL no build
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Log da variável para debug
RUN echo ">>> DATABASE_URL no build: $DATABASE_URL"

# Gera os clientes do Prisma
RUN npx prisma generate || (echo ">>> ERRO no prisma generate" && exit 1)

# Compila a aplicação
RUN npm run build

# ---------------------------
# Runtime image
# ---------------------------
FROM node:26-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY prisma ./prisma

USER appuser

# Log da variável no runtime
CMD echo ">>> DATABASE_URL no runtime: $DATABASE_URL" && \
    npx prisma generate && \
    node dist/main.js
