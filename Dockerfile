### Stage 1: build da aplicação NestJS
FROM node:26-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm install

# Copia o restante do código (inclui prisma/schema.prisma)
COPY . .

# Gera os clientes do Prisma (necessário para o build)
RUN npx prisma generate

# Build para a pasta dist
RUN npm run build


### Stage 2: imagem final de produção
FROM node:26-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copia apenas o necessário do estágio de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Diretório padrão de uploads (pode ser sobrescrito via variável de ambiente / compose)
ENV UPLOAD_DIR=/app/uploads-file
RUN mkdir -p ${UPLOAD_DIR}

CMD ["npm", "run", "start:prod"]
