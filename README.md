# Torneio de Sueca — São Cibrão

Projector-facing tournament dashboard for a **Sueca** (Portuguese 4-player trick-taking card game) tournament. Runs on a projector during the live event organised by the Comissão de Festas de São Cibrão: operators configure the tournament once, then the screen auto-rotates between views (current match, bracket, ranking, MVP, upcoming/history, QR) while the admin enters scores from a side panel.

## Stack

- **Backend** — Go (Gin + GORM), PostgreSQL
- **Frontend** — React (CDN UMD) served via nginx; styled with vanilla CSS (Playfair / Inter / JetBrains Mono)
- **Orchestration** — Docker Compose (dev + prod via separate `.env.*` files)

## Getting started

```bash
cp .env.example .env.dev    # edit values
./app.sh dev                # boots compose stack on dev env
```

Production:

```bash
cp .env.example .env.prod   # fill POSTGRES_PASSWORD + JWT_SECRET with real values
./app.sh prod
```

The frontend is exposed on `FRONTEND_PORT` (default 8280 for dev, 80 for prod); the backend is only reachable on the internal Docker network and must be fronted by a reverse proxy in production.

### Environment files

Only `.env.example` is tracked. `.env.dev` / `.env.prod` are ignored by `.gitignore` — keep local secrets out of the repo.

## Keyboard shortcuts (projector)

| Key | Action |
|-----|--------|
| `Space` | Pause / resume view rotation |
| `← / →` | Step through views manually |
| `A` | Toggle admin panel |
| `F` | Toggle fullscreen |

## Project layout

```
backend/                 Go API (matches, teams, scores)
frontend/public/         React SPA (index.html + *.jsx + styles.css)
docker-compose.yml       dev + prod stack
app.sh                   wrapper: ./app.sh {dev|prod} {up|down|logs|...}
```

## License

MIT — see [LICENSE](LICENSE).
