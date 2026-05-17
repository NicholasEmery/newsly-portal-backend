FROM node:26-alpine AS builder
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./
RUN npm ci

# Copia o restante do código
COPY . .

# Build da aplicação (gera dist)
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

# Prisma generate será rodado em runtime, junto com o start
CMD npx prisma generate && node dist/main.js
