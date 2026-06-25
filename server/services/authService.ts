const LOCAL_AUTH_PASSWORD_ENV = "LOCAL_AUTH_DEV_PASSWORD";

export interface LocalAuthPasswordConfig {
  password: string;
  usesDevPassword: boolean;
}

export function readConfiguredLocalAuthPassword(env: NodeJS.ProcessEnv = process.env): LocalAuthPasswordConfig | null {
  const password = env[LOCAL_AUTH_PASSWORD_ENV]?.trim();
  if (!password) return null;
  return {
    password,
    usesDevPassword: false,
  };
}

export function getLocalAuthSetupError(): string {
  return `${LOCAL_AUTH_PASSWORD_ENV} must be configured before local login is available. Set it in .env for desktop/local use or hosting secrets for production.`;
}
