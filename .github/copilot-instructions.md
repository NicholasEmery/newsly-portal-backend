# Newsly Backend Copilot Instructions

Use these rules when reviewing or changing the backend in this repository.

## Stack And Architecture

- This repo is a NestJS 11 backend with Prisma, Redis cache-manager, JWT auth, Swagger, Jest, and TypeScript.
- Keep the module structure under `src/auth`, `src/users`, `src/posts`, `src/notifications`, `src/common`, and `src/database`.
- Preserve the existing NestJS pattern: thin controllers, service-driven business logic, and module-level wiring.

## Database And Prisma

- All database access must go through `PrismaService`.
- Do not instantiate `PrismaClient` directly in feature code.
- Preserve the lifecycle behavior in `src/database/prisma.service.ts`: connect on module init, disconnect on shutdown, and keep the retry/logging behavior intact.
- Treat `generated/prisma` as generated output. Schema and migration changes belong in the Prisma source files, not in generated client code.

## Auth And Security

- Preserve the auth flow built by `AuthModule`, `LocalModule`, `GoogleModule`, `TokensService`, `AuthGuard`, and `RolesGuard`.
- Review changes to authentication, refresh tokens, password reset, email verification, and session handling as security-sensitive.
- Keep JWT and other secrets sourced from environment variables.
- Avoid widening access or weakening guard checks without a clear reason.

## Config And Infra

- Keep `ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true })` and the current Redis cache setup unless the task explicitly changes infrastructure.
- Do not hardcode secrets, hostnames, or ports in feature code.
- Preserve existing environment-driven behavior for database, cache, and auth configuration.

## Controllers, DTOs, And Swagger

- Keep controllers thin: validate inputs with DTOs, delegate logic to services, and translate errors into HTTP exceptions when needed.
- Preserve Swagger decorators on public routes when they already exist or when new endpoints need API documentation.
- Maintain request/response contracts carefully; changes here are part of the public API.

## Testing

- Tests use Jest with mocked services such as `PrismaService`, `JwtService`, and `TokenHelper`.
- Add or update focused unit tests when touching services, controllers, guards, or token handling.
- Prefer deterministic tests that assert repository behavior, error paths, and security edge cases.

## Review Priorities

- Check for broken module imports/exports, provider wiring, and circular dependency risks.
- Check for unsafe database queries, missing validation, and incorrect auth/session state changes.
- Check that new code keeps the current NestJS style and does not bypass existing shared services.

## Validation

- Prefer targeted Jest coverage for the touched module or service.
- Use lint and build checks when the change affects shared module wiring or broader application startup.
