FROM node:26-alpine AS builder
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copia o restante do código
COPY . .

# Copia o .env para dentro da imagem (precisa estar no contexto)
COPY .env .env

# Carrega variáveis do .env e roda prisma generate
RUN export $(cat .env | xargs) && \
    echo ">>> DATABASE_URL=$DATABASE_URL" && \
    npx prisma generate || (echo ">>> ERRO no prisma generate" && exit 1)

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

CMD echo ">>> DATABASE_URL no runtime: $DATABASE_URL" && \
    npx prisma generate && \
    node dist/main.js
