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

# Gera os clientes do Prisma (precisa da variável DATABASE_URL)
RUN npx prisma generate

# Compila a aplicação
RUN npm run build

# ---------------------------
# Runtime image
# ---------------------------
FROM node:26-alpine AS runner
WORKDIR /app

# Cria usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia apenas o necessário da imagem builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY prisma ./prisma

USER appuser

CMD ["node", "dist/main.js"]
