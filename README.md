# LedgerFlow Hub

LedgerFlow Hub la phan mem desktop-first cho mot chu so huu/solo founder quan ly company OS: san pham, marketing, sales/CRM, tai chinh, du an, AI nhan su, sandbox, tich hop va DevOps handoff.

Ban Windows desktop la ban duy nhat de su dung hang ngay. React/Express van ton tai trong source code vi Electron can chung de render giao dien va chay API noi bo; khong phat hanh hay van hanh mot ban web rieng.

## Dung nhu phan mem Windows

Chay:

```bat
tools\windows\BUILD_WINDOWS_INSTALLER.bat
```

Build xong, mo thu muc:

```text
release/
```

Bam file `.exe` de cai dat **LedgerFlow Hub**.

## Chay dev local

Danh cho nguoi sua code/test. Che do nay chi la ha tang noi bo de lap trinh, khong phai ban web rieng cho nguoi dung:

```bash
npm install
npm run dev
```

Tren Windows co the dung script phu:

```bat
tools\windows\RUN_LOCAL_DEV.bat
```

## AI Gateway

LedgerFlow Hub co man hinh **AI Gateway** de nhap nhieu API key truc tiep trong phan mem, khong can sua `.env` tren tung may.

Mo app Windows roi bam nut noi **AI Gateway** o goc phai duoi.

AI Gateway ho tro nhieu key/provider va tu fallback khi het quota:

```text
Gemini nhieu tai khoan -> Groq -> OpenRouter -> Claude -> Ollama local
```

Tai lieu chi tiet:

```text
docs/AI_GATEWAY.md
```

## Kiem tra chat luong code

Truoc khi build hoac push:

```bash
npm run lint
npm run build
```

Repo co GitHub Actions CI de tu chay type-check va build khi push/pull request.

## Tai lieu

Tai lieu chi tiet nam trong:

```text
docs/
```

## Nhanh cho AI coder (Gemini/ChatGPT/Claude/Copilot)

Neu ban code truc tiep tren GitHub hoac editor AI, doc nhanh theo thu tu:

```text
CODEMAP.md
AGENTS.md
docs/PROJECT_STRUCTURE.md
docs/AI_AGENT_PLAYBOOK.md
CONTRIBUTING.md
docs/GREEN_MERGE_POLICY.md
```

Quy tac ngan:

- Them module moi: uu tien `src/modules/<domain>/`.
- Them API/UI ket noi backend: `src/utils/*Api.ts` + `server/services/*`.
- Them connector: `server/services/<platform>Connector.ts` + panel trong `src/components/`.
- Khong goi provider AI truc tiep tu frontend.
- Truoc push: `npm run lint` va `npm run build`.

Lenh huu ich de giu repo gon khi code truc tiep:

- `npm run runtime:migrate` (gom local runtime files tu root vao `runtime/`)
- `npm run clean -- --runtime` (xoa build/cache va archive runtime local vao `.local-cleanup/`)
- `npm run check:codemap` (guard placement theo CODEMAP)
- `npm run check:pr-readiness` (risk-aware pre-merge checks cho moi AI platform)

Script phu nam trong:

```text
tools/windows/
```

## Cau truc khong nen doi tuy tien

- `src/`: giao dien, module, mo phong, dashboard cho app desktop
- `desktop/`: vo app desktop Electron
- `build/`: icon/logo va asset dong goi
- `scripts/`: kiem tra build/CI
- `server.ts`: server local/API noi bo
- `package.json`: cau hinh build va installer

Muc tieu la giu mot phan mem Windows duy nhat, khong tach thanh hai ban web/desktop khac nhau.
