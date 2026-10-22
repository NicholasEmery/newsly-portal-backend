# Compatibilidade de releases

O backend publica seu contrato em `GET /api/compatibility`. O endpoint nao
contem segredos e deve permanecer acessivel dentro da rede do Newsly.

## Contrato atual

- API: `2026.1`
- frontend minimo aceito: `2026.1`
- frontend maximo aceito: `2026.1`

As variaveis `NEWSLY_API_CONTRACT_VERSION`,
`NEWSLY_FRONTEND_CONTRACT_MIN` e `NEWSLY_FRONTEND_CONTRACT_MAX` podem ser
definidas somente pelo runtime de release. Uma alteracao incompativel exige
uma nova versao de contrato e uma janela em que o backend aceite tanto o
contrato anterior quanto o novo.

## Regra de deploy

Uma release de frontend so pode ser ativada quando o contrato de API ativo
estiver dentro de sua faixa requerida. Uma release de backend so pode ser
ativada quando a faixa aceita pelo backend incluir o contrato do frontend
ativo.
