import assert from "node:assert/strict";
import test from "node:test";
import { classifyWebAIPageText } from "./webAiPolicy.ts";
import { WebAiSessionManager } from "./webAiSessionManager.ts";

test("classifies quota and platform errors without matching normal copy", () => {
  assert.equal(classifyWebAIPageText("You've reached your usage limit. Try again later."), "quota");
  assert.equal(classifyWebAIPageText("Something went wrong while generating a response."), "platform_error");
  assert.equal(classifyWebAIPageText("Usage limits are described in the product documentation."), null);
});

test("accepts only registered Web AI platforms", () => {
  assert.equal(WebAiSessionManager.isSupportedPlatform("Gemini"), true);
  assert.equal(WebAiSessionManager.isSupportedPlatform("unknown-provider"), false);
});

test("profile paths remain inside the managed profile directory", () => {
  const resolved = WebAiSessionManager.getProfilePath("../outside");
  assert.match(resolved, /\.chrome_profiles[\\/]outside$/);
});
