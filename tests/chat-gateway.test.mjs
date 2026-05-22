import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeChatMessages,
  parseRuntimeOptions,
  validateProviderConfig,
} from "../quality/chat-gateway.mjs";

describe("normalizeChatMessages", () => {
  it("keeps only valid chat roles and the latest messages", () => {
    assert.deepEqual(
      normalizeChatMessages([
        { role: "tool", content: "drop" },
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ], 1),
      { valid: true, messages: [{ role: "assistant", content: "hi" }], error: null }
    );
  });
});

describe("parseRuntimeOptions", () => {
  it("clamps token and temperature limits", () => {
    assert.deepEqual(parseRuntimeOptions({ MAX_TOKENS: "999999", TEMPERATURE: "9", AI_MODEL: "grok-3" }), {
      model: "grok-3",
      maxTokens: 8192,
      temperature: 2,
    });
  });
});

describe("validateProviderConfig", () => {
  it("blocks missing API keys and malformed provider URLs", () => {
    assert.deepEqual(validateProviderConfig({ API_BASE_URL: "not-a-url" }), {
      ready: false,
      blockers: ["missing-api-key", "invalid-api-base-url"],
    });
  });
});
