# AI Software Factory Connectors

This document lists the connector routes used by AI Workforce & Factory and the local configuration keys required to activate them.

## Runtime endpoints

- `GET /api/software-factory/connectors`
- `GET /api/software-factory/connectors/config`
- `GET /api/software-factory/connectors/env-template`
- `GET /api/software-factory/health-summary`

## Connector groups

| Group | Count | Purpose |
| --- | ---: | --- |
| AI platforms | 8 | Model APIs, multimodal generation, research, local model route |
| AI agents | 3 | Code/task agent routes |
| IDEs | 4 | Workspace editing and review routes |
| Repo / CI | 2 | Repository, PR and CI routes |
| Local runtime | 2 | Local command and model runtime routes |

## Environment keys

Copy these keys into your local `.env` or environment manager. Leave unused keys blank.

```env
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
MISTRAL_API_KEY=
COHERE_API_KEY=
PERPLEXITY_API_KEY=
HUGGINGFACE_TOKEN=
HF_TOKEN=
OLLAMA_BASE_URL=
GITHUB_TOKEN=
CURSOR_WORKSPACE_PATH=
SOFTWARE_FACTORY_WORKSPACE=
ANTIGRAVITY_WORKSPACE_PATH=
WINDSURF_WORKSPACE_PATH=
```

## Activation checklist

1. Add the keys you actually use to local `.env`.
2. Start the Software Factory daemon.
3. Open AI Workforce & Factory.
4. Refresh AI Connector Matrix.
5. Verify each connector is `configured`, `missing`, or `not required`.
6. Refresh Workspace Health Summary to see connector readiness.
7. Run `npm run check:software-factory`.

## Review policy

High-impact actions remain review-gated. Connector setup only enables official API, token, CLI or local workspace routes. It does not perform public release, payment, destructive file actions or main-branch merge without explicit review.
