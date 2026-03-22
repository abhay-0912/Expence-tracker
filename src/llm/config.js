export const DEFAULT_LLM_PROVIDER = "claude";

export function getLLMProviderNameFromEnv(env = process.env) {
  return (env.LLM_PROVIDER || DEFAULT_LLM_PROVIDER).toLowerCase();
}
