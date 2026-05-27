export type RuntimeEnvironment = "development" | "production";
export type DeploymentTarget = "local" | "docker";

const normalizeValue = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const resolveRuntimeEnvironment = (): RuntimeEnvironment => {
  const raw = normalizeValue(process.env.NEWSLY_ENV) ?? normalizeValue(process.env.NODE_ENV) ?? "production";
  return raw.toLowerCase() === "development" ? "development" : "production";
};

export const resolveDeploymentTarget = (): DeploymentTarget => {
  const raw = normalizeValue(process.env.NEWSLY_DEPLOYMENT_TARGET) ?? "local";
  return raw.toLowerCase() === "docker" ? "docker" : "local";
};

const resolveTaggedValue = (
  localValue?: string | null,
  dockerValue?: string | null,
  fallbackValue?: string | null,
): string | null => {
  const target = resolveDeploymentTarget();
  const preferredValues =
    target === "docker" ? [dockerValue, fallbackValue, localValue] : [localValue, fallbackValue, dockerValue];

  for (const value of preferredValues) {
    const normalized = normalizeValue(value);
    if (normalized) return normalized;
  }

  return null;
};

export const resolveFrontendUrl = (): string =>
  resolveTaggedValue(
    process.env.FRONTEND_URL_LOCAL || process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_DOCKER || process.env.FRONTEND_URL,
    process.env.FRONTEND_URL,
  ) ?? "http://localhost:3000";

export const isAllowedFrontendOrigin = (origin?: string | null): boolean => {
  if (!origin) return true;

  try {
    const parsed = new URL(origin);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname.endsWith(".local")) {
      return true;
    }

    return parsed.origin === "https://newsly.nicholasemery.dev";
  } catch {
    return false;
  }
};
