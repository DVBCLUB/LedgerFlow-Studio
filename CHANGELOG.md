# Changelog

Tat ca thay doi quan trong cua du an se duoc ghi lai trong tai lieu nay.

## [2026-07-01] BRIEF4 - Tang cuong runtime va kiem soat van hanh

Commit: db0b205

### Bo sung
- Bo sung co che phat hien va sua lech (drift) cho runtime mission queue (API + tich hop dashboard).
- Bo sung endpoint diagnostics cho browser sandbox de theo doi loi theo host va trang thai cooldown.
- Bo sung che do task browser sandbox cho Claude va DeepSeek o ca backend contract va frontend control.
- Bo sung buoc xac nhan tu operator cho fallback-only truoc khi chay browser mode.

### Thay doi
- Suc khoe AI Gateway hien tra ve snapshot song lay tu router diagnostics.
- Qua trinh tao runtime mission execution queue da lien ket voi cau truc source-of-truth cua AgentRun.
- Runtime smoke checks duoc harden de dam bao xac minh local on dinh va co the lap lai.
- Cac endpoint list/drift cua mission queue duoc gioi han limit ngay tai API boundary cua daemon.

### Sua loi
- Sua bat dong import/runtime contract trong wiring cua runtime hub va mission queue.
- Giam xung dot rename tren secure store local Windows bang co che ghi an toan hon.
- Sua cac van de route/module compatibility anh huong den luong check:runtime local.

### Xac minh
- npm run lint: pass
- npm run check:runtime: pass
- Runtime route contract checks: pass
