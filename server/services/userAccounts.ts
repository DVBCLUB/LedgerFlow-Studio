/**
 * userAccounts.ts
 * ============================================================
 * Tài khoản người dùng local (nền cho đa người dùng / SSO sau này).
 *
 * Thay vì 1 mật khẩu chung cho mọi người, owner có thể tạo nhiều tài khoản
 * với role (owner/operator/viewer). Mật khẩu được băm bằng scrypt (builtin).
 * Khi chưa tạo tài khoản nào → giữ nguyên hành vi cũ (1 mật khẩu dev chung).
 */

import fs from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export type LocalRole = 'owner' | 'operator' | 'viewer' | 'automation';

export interface LocalUser {
  email: string;
  role: LocalRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

const FILE = resolveRuntimePathFromEnv('USER_ACCOUNTS_FILE', 'user_accounts.json');

let cache: LocalUser[] | null = null;

function loadUsers(): LocalUser[] {
  if (cache) return cache;
  try {
    const p = resolveRuntimeReadPathFromEnv('USER_ACCOUNTS_FILE', 'user_accounts.json');
    if (!fs.existsSync(p)) {
      cache = [];
      return cache;
    }
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    cache = Array.isArray(parsed) ? (parsed as LocalUser[]) : [];
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

function saveUsers(users: LocalUser[]): void {
  cache = users;
  try {
    ensureRuntimeRootSync();
    const tmp = `${FILE}.tmp`;
    const bak = `${FILE}.bak`;
    if (fs.existsSync(FILE)) {
      try {
        fs.copyFileSync(FILE, bak);
      } catch {
        // bỏ qua
      }
    }
    fs.writeFileSync(tmp, JSON.stringify(users, null, 2), 'utf8');
    fs.renameSync(tmp, FILE);
  } catch (err) {
    console.error('[UserAccounts] persist failed:', err);
  }
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 32).toString('hex');
}

export function listUsers(): Array<Omit<LocalUser, 'passwordHash' | 'salt'>> {
  return loadUsers().map(({ email, role, createdAt }) => ({ email, role, createdAt }));
}

export function createUser(input: { email: string; password: string; role?: LocalRole }): { ok: boolean; error?: string; user?: Omit<LocalUser, 'passwordHash' | 'salt'> } {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) return { ok: false, error: 'Email không hợp lệ.' };
  if (!input.password || input.password.length < 6) return { ok: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' };

  const users = loadUsers();
  if (users.some((u) => u.email === email)) return { ok: false, error: 'Tài khoản đã tồn tại.' };

  // Tài khoản đầu tiên luôn là owner (chống việc owner tự khóa mình).
  const hasOwner = users.some((u) => u.role === 'owner');
  const requestedRole = input.role && ['owner', 'operator', 'viewer', 'automation'].includes(input.role) ? input.role : 'operator';
  const role = hasOwner ? requestedRole : 'owner';

  const salt = randomBytes(16).toString('hex');
  const user: LocalUser = {
    email,
    role,
    passwordHash: hashPassword(input.password, salt),
    salt,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return { ok: true, user: { email: user.email, role: user.role, createdAt: user.createdAt } };
}

export function deleteUser(email: string): boolean {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === email.trim().toLowerCase());
  if (idx < 0) return false;
  users.splice(idx, 1);
  saveUsers(users);
  return true;
}

/**
 * Xác thực 1 tài khoản local. Trả về role nếu khớp, null nếu sai mật khẩu/không tồn tại.
 */
export function verifyUser(email: string, password: string): LocalRole | null {
  const user = loadUsers().find((u) => u.email === email.trim().toLowerCase());
  if (!user) return null;
  const hash = hashPassword(password, user.salt);
  const a = Buffer.from(hash);
  const b = Buffer.from(user.passwordHash);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? user.role : null;
}

/** Chỉ dùng trong test: xóa cache để mô phỏng trạng thái "chưa có tài khoản nào" (bootstrap). */
export function resetUserAccountsForTest(): void {
  cache = [];
}
