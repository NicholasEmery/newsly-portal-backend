# Define a imagem base Node.js usada em todos os estágios.
ARG NODE_BASE=node:26-alpine

# Estágio 1: instala dependências de desenvolvimento, gera o client do Prisma e compila a aplicação Nest.
FROM ${NODE_BASE} AS builder

# Define o diretório de trabalho do backend no container.
WORKDIR /backend

# Copia os manifests para aproveitar o cache do npm.
COPY package.json package-lock.json ./

# Instala dependências de desenvolvimento necessárias para o Prisma e para o build.
RUN --mount=type=cache,target=/root/.npm npm ci --include=dev --no-audit --no-fund --prefer-offline

# Copia o schema e a configuração do Prisma para o estágio de geração.
COPY prisma ./prisma

# Copia a configuração do TypeScript e do Nest para o build da aplicação.
COPY tsconfig*.json nest-cli.json ./

# Copia o código-fonte da aplicação Nest.
COPY src ./src

# Lê o .env montado como segredo de build e expõe as variáveis apenas durante a geração.
RUN --mount=type=secret,id=dotenv,required=true sh -c 'set -a && . /run/secrets/dotenv && set +a && npx prisma generate --schema=prisma/schema.prisma'

# Compila a aplicação para o diretório dist.
RUN npm run build

# Estágio 3: cria uma base mínima comum para a imagem final.
FROM ${NODE_BASE} AS base

# Define o ambiente como produção.
ENV NODE_ENV=production

# Desativa a telemetria do Prisma no container.
ENV PRISMA_HIDE_UPDATE_MESSAGE=1

# Define o diretório de trabalho do backend no container.
WORKDIR /backend

# Instala certificados CA e cria um usuário não-root com UID/GID fixos.
RUN apk add --no-cache ca-certificates \
	&& addgroup -S -g 10001 backendgroup \
	&& adduser -S -D -H -u 10001 -G backendgroup backenduser

# Estágio 4: monta a imagem endurecida com somente o necessário para executar.
FROM base AS hardened

# Copia os manifests para instalar apenas dependências de produção.
COPY package.json package-lock.json ./

# Instala apenas dependências de runtime, mantendo scripts para compilar módulos nativos como bcrypt.
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund --prefer-offline

# Copia a pasta gerada do Prisma a partir do estágio de build.
COPY --from=builder --chown=backenduser:backendgroup /backend/generated ./generated

# Copia o resultado compilado do Nest a partir do estágio de build.
COPY --from=builder --chown=backenduser:backendgroup /backend/dist ./dist

# Troca para o usuário não-root antes de iniciar a aplicação.
USER backenduser

# Inicia a aplicação compilada no entrypoint padrão do Nest.
CMD ["node", "dist/src/main.js"]
