# AI Coding Assistant — Module Guide

## Tổng quan

Module này thêm một **local AI coding daemon** vào LedgerFlow-Studio — một Express server chạy song song trên port 3001, nhận lệnh từ Telegram, CLI, hoặc REST API, và thực hiện các thao tác đọc/sửa/tạo file có backup an toàn, sử dụng Multi-LLM Router đã có sẵn.

## Các file

| File | Vai trò |
|------|---------|
| `server/assistant-daemon.ts` | Express server daemon port 3001 |
| `server/services/safeFileManager.ts` | Backup + write + rollback an toàn |
| `server/services/codingContext.ts` | Build AI prompt + parse code response |
| `server/services/telegramBot.ts` | Telegram bot handler |
| `server/services/vscodeContextExporter.ts` | Export context cho VS Code/Cursor |
| `server/services/assistant-daemon.types.ts` | Shared types |
| `scripts/ai-assistant-cli.ts` | CLI interface |
| `.env.assistant.example` | Template cấu hình |

## Cài đặt nhanh

```bash
# 1. Copy và điền cấu hình
copy .env.assistant.example .env
# Điền: TELEGRAM_BOT_TOKEN, TELEGRAM_ALLOWED_CHAT_IDS, ASSISTANT_WORKSPACE

# 2. Khởi động daemon
npm run assistant:start

# 3. Dùng CLI (daemon phải đang chạy)
npm run assistant:cli -- status
npm run assistant:cli -- ask "Hello!"
```

## Cấu hình (.env)

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `TELEGRAM_BOT_TOKEN` | — | Bot token từ @BotFather |
| `TELEGRAM_ALLOWED_CHAT_IDS` | — | User IDs được phép (bảo mật) |
| `TELEGRAM_MODE` | `polling` | `polling` hoặc `webhook` |
| `ASSISTANT_PORT` | `3001` | Port của daemon |
| `ASSISTANT_WORKSPACE` | `process.cwd()` | Workspace root (sandbox) |
| `MAX_FILE_SIZE_KB` | `500` | Giới hạn đọc file |

## REST API

```http
# Health check (nhanh)
GET http://127.0.0.1:3001/health

# AI provider status (chậm — ping từng provider)
GET http://127.0.0.1:3001/api/status

# Hỏi AI không có file context
POST http://127.0.0.1:3001/api/ask
{ "question": "string", "task": "coding|general|...", "model": "ai-assistant|ai-assistant-pro" }

# Đọc file / thư mục
POST http://127.0.0.1:3001/api/read
{ "file": "relative/path" }                # đọc 1 file
{ "directory": ".", "recursive": false }    # liệt kê thư mục

# AI đề xuất sửa file
POST http://127.0.0.1:3001/api/edit
{ "file": "src/App.tsx", "instruction": "Thêm error boundary" }

# Apply đề xuất AI (tạo backup trước)
POST http://127.0.0.1:3001/api/apply
{ "file": "src/App.tsx", "backupStrategy": "auto" }

# Rollback về backup trước
POST http://127.0.0.1:3001/api/rollback
{ "file": "src/App.tsx" }

# Tạo file mới bằng AI
POST http://127.0.0.1:3001/api/create
{ "file": "src/utils/logger.ts", "instruction": "Tạo logger module" }

# Xem backups của file
GET http://127.0.0.1:3001/api/backups?file=src/App.tsx

# Tạo unified diff
POST http://127.0.0.1:3001/api/diff
{ "file": "src/App.tsx", "original": "...", "suggested": "..." }

# Export context cho VS Code/Cursor
POST http://127.0.0.1:3001/api/export
{ "file": "src/App.tsx", "format": "cursor|copilot|continue|generic" }
```

## Telegram Commands

```
/start      — Xem hướng dẫn
/status     — AI provider status
/ask <q>    — Hỏi AI
/read <f>   — Đọc file
/ls [dir]   — Liệt kê thư mục
/edit <f> <msg>  — AI đề xuất sửa file
/apply <f>  — Apply đề xuất AI
/rollback <f>    — Hoàn tác
/create <f> <msg>— Tạo file mới
```

## CLI Commands

```bash
npm run assistant:cli -- ask "Câu hỏi"
npm run assistant:cli -- read src/App.tsx
npm run assistant:cli -- ls src/components
npm run assistant:cli -- edit src/utils.ts "Thêm type safety"
npm run assistant:cli -- apply src/utils.ts
npm run assistant:cli -- rollback src/utils.ts
npm run assistant:cli -- create src/logger.ts "Winston logger setup"
npm run assistant:cli -- status
npm run assistant:cli -- export src/App.tsx --format cursor
npm run assistant:cli -- chat    # Interactive REPL
```

## Backup Strategy

| Strategy | Điều kiện | Cơ chế |
|----------|-----------|--------|
| `auto` (mặc định) | Luôn | Thử git commit trước, fallback sang file copy |
| `git-commit` | Cần git repo | `git add <file> && git commit -m "ai-backup: ..."` |
| `file-copy` | Luôn hoạt động | Copy sang `.ai_backups/<timestamp>/<file>` |

## Security

- ✅ Path sandboxed trong `ASSISTANT_WORKSPACE` — không thể đọc/ghi ngoài workspace
- ✅ Telegram whitelist theo user ID (`TELEGRAM_ALLOWED_CHAT_IDS`)
- ✅ Daemon chỉ bind `127.0.0.1` (không expose ra network)
- ✅ Không commit secrets — AI keys vẫn qua LedgerFlow Key Vault

## Multi-LLM Priority (task: coding)

```
Anthropic Claude → OpenAI GPT → DeepSeek → OpenRouter → Gemini → Groq → Ollama
```

Cấu hình key tại: `http://127.0.0.1:3000/#/ai_settings` (LedgerFlow main app).
