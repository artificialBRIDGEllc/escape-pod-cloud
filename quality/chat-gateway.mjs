export function normalizeChatMessages(rawMessages, limit = 60) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return { valid: false, messages: [], error: "invalid-request-body" };
  }

  const allowedRoles = new Set(["user", "assistant", "system"]);
  const messages = rawMessages
    .filter((message) => allowedRoles.has(message.role) && typeof message.content === "string" && message.content.trim().length > 0)
    .slice(-limit)
    .map((message) => ({ role: message.role, content: message.content }));

  return { valid: messages.length > 0, messages, error: messages.length > 0 ? null : "no-valid-messages" };
}

export function parseRuntimeOptions(env) {
  const maxTokens = Number.parseInt(env.MAX_TOKENS ?? "4096", 10);
  const temperature = Number.parseFloat(env.TEMPERATURE ?? "0.7");
  return {
    model: env.AI_MODEL || "grok-3",
    maxTokens: Number.isFinite(maxTokens) ? Math.min(Math.max(maxTokens, 1), 8192) : 4096,
    temperature: Number.isFinite(temperature) ? Math.min(Math.max(temperature, 0), 2) : 0.7,
  };
}

export function validateProviderConfig(env) {
  const blockers = [];
  if (!env.XAI_API_KEY) blockers.push("missing-api-key");
  if (env.API_BASE_URL && !/^https?:\/\//.test(env.API_BASE_URL)) blockers.push("invalid-api-base-url");
  return { ready: blockers.length === 0, blockers };
}
