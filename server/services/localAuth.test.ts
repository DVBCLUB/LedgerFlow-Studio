import assert from "node:assert/strict";
import test from "node:test";
import {
  clearLocalSession,
  createLocalSession,
  readLocalServerSession,
  requireLocalAuth,
  setLocalSessionCookie,
} from "./localAuth.ts";

function responseStub() {
  const headers = new Map<string, string>();
  return {
    headers,
    statusCode: 200,
    payload: undefined as unknown,
    setHeader(name: string, value: string) { headers.set(name, value); },
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.payload = payload; return this; },
  };
}

test("session cookie authorizes requests and logout revokes it", () => {
  const previousPassword = process.env.LOCAL_AUTH_DEV_PASSWORD;
  process.env.LOCAL_AUTH_DEV_PASSWORD = "test-password";
  try {
    const created = createLocalSession("owner@ledgerflow.local", "test-password");
    assert.ok(created);
    const loginResponse = responseStub();
    setLocalSessionCookie(loginResponse as never, created.token);
    const cookie = loginResponse.headers.get("Set-Cookie")?.split(";")[0];
    assert.ok(cookie);
    assert.match(loginResponse.headers.get("Set-Cookie") || "", /HttpOnly/);
    assert.match(loginResponse.headers.get("Set-Cookie") || "", /SameSite=Strict/);

    const request = { headers: { cookie } };
    assert.equal(readLocalServerSession(request as never)?.email, "owner@ledgerflow.local");
    let nextCalled = false;
    requireLocalAuth(request as never, responseStub() as never, () => { nextCalled = true; });
    assert.equal(nextCalled, true);

    const logoutResponse = responseStub();
    clearLocalSession(request as never, logoutResponse as never);
    assert.equal(readLocalServerSession(request as never), null);
    assert.match(logoutResponse.headers.get("Set-Cookie") || "", /Max-Age=0/);
  } finally {
    if (previousPassword === undefined) delete process.env.LOCAL_AUTH_DEV_PASSWORD;
    else process.env.LOCAL_AUTH_DEV_PASSWORD = previousPassword;
  }
});

test("middleware rejects anonymous requests and accepts configured bearer token", () => {
  const previousToken = process.env.LEDGERFLOW_API_TOKEN;
  process.env.LEDGERFLOW_API_TOKEN = "automation-token";
  try {
    const anonymousResponse = responseStub();
    requireLocalAuth({ headers: {} } as never, anonymousResponse as never, () => assert.fail("anonymous request passed"));
    assert.equal(anonymousResponse.statusCode, 401);

    let nextCalled = false;
    requireLocalAuth(
      { headers: { authorization: "Bearer automation-token" } } as never,
      responseStub() as never,
      () => { nextCalled = true; },
    );
    assert.equal(nextCalled, true);
  } finally {
    if (previousToken === undefined) delete process.env.LEDGERFLOW_API_TOKEN;
    else process.env.LEDGERFLOW_API_TOKEN = previousToken;
  }
});

