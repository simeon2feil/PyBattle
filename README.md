# PyClash Frontend

Next.js-UI für 1v1 Python-Battles, Solo-Mode und Leaderboard. Das Frontend redet **nur** mit der REST-API (`src/lib/api.ts`), nie mit der Datenbank.

## Start

```bash
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

## Backend-Anbindung

`.env.local` (siehe `.env.example`):

| Variable | Bedeutung |
|---|---|
| `NEXT_PUBLIC_API_URL` | Express-API, z.B. `http://localhost:4000` |
| `NEXT_PUBLIC_USE_MOCK` | `true` = lokale Demo ohne Backend |

Antwortformat der API: `{ success: true, data }` oder `{ success: false, error }`.

Bei `USE_MOCK=true` laufen Register/Login, Solo-Timing (Min. 5s / Max. 15min), Submit und Battle-Queue lokal in `localStorage`.
