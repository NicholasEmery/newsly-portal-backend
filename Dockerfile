### Stage 1: build da aplicação NestJS
FROM node:26-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala o Prisma CLI globalmente para gerar os clientes
RUN npm install -g prisma

# Copia o schema do Prisma para gerar os clientes
COPY prisma ./prisma

# Gera os clientes do Prisma (necessário para o build)
RUN prisma generate

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm install

# Copia o restante do código
COPY . .

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
COPY --from=builder /app/prisma ./prisma

# Diretório padrão de uploads (pode ser sobrescrito via variável de ambiente / compose)
ENV UPLOAD_DIR=/app/uploads-file
RUN mkdir -p ${UPLOAD_DIR}

CMD ["npm", "run", "start:prod"]
