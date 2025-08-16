# ignite-backend

Professional, fast scaffolding for modern Express backends in JavaScript or TypeScript. Choose a language, optional database layer (MongoDB / PostgreSQL / MySQL), and JWT authentication in seconds.

---

## ✨ Why ignite-backend?
| Goal | What You Get |
| ---- | ------------- |
| Start quickly | One interactive command with sensible defaults |
| Consistent structure | Opinionated MVC layout (controllers / routes / models) |
| Flexible data | Mongo (Mongoose) or SQL (Prisma) or skip DB entirely |
| Built‑in auth | Optional JWT register/login flow + middleware |
| TS first | Full TypeScript template plus parallel JS template |
| Low friction | Minimal dependencies, clear scripts, environment setup |

---

## 🚀 Quick Start

Using npm (recommended):
```bash
npm create ignite-backend@latest
```

Or with npx:
```bash
npx ignite-backend@latest
```

Beta channel (pre‑release testing):
```bash
npm create ignite-backend@beta
```

Follow the prompts; your project directory is created and populated.

---

## ⚙️ CLI Options (Prompts)
| Prompt | Choices | Effect |
| ------ | ------- | ------ |
| Language | JavaScript / TypeScript | Determines file extensions & TS build setup |
| Database | MongoDB / PostgreSQL / MySQL / None | Adds Mongoose or Prisma boilerplate (or none) |
| Auth | Yes / No | Adds User model/schema, JWT auth routes & middleware |

Non‑interactive usage (example):
```bash
npx ignite-backend@latest my-api --yes --language typescript --database postgresql --auth
```

---

## 📁 Generated Structure (excerpt)
```
your-project/
	app.(js|ts)
	server.(js|ts)
	package.json
	src/
		controllers/
			exampleController.(js|ts)
		routes/
			exampleRoutes.(js|ts)
		models/
			Example.(js|ts)
			(User.(js|ts) if auth)
		authMiddleware.(js|ts)           (if auth)
		prismaClient.(js|ts)             (if Prisma)
	prisma/schema.prisma               (if PostgreSQL/MySQL)
	.env.example
```

`{{projectName}}` placeholders are replaced automatically.

---

## 🧪 Scripts (Inside Generated Project)
| Script | JS Template | TS Template |
| ------ | ----------- | ----------- |
| dev | `nodemon server.js` | `nodemon --watch src --exec ts-node src/server.ts` |
| build | (n/a) | `tsc` |
| start | `node server.js` | `node dist/server.js` |
| prisma (added) | – | `prisma generate` (if Prisma DB chosen) |

---

## 🔐 Authentication (Optional)
Adds:
* `authController` (register + login)
* `authMiddleware` (JWT verification)
* `User` model (Mongoose) OR schema comment (Prisma) OR in‑memory fallback
* Routes mounted at `/api/auth`:
	* `POST /api/auth/register` – `{ email, password }`
	* `POST /api/auth/login` – `{ email, password }` → `{ token }`

JWT secret: `JWT_SECRET` (from `.env`).

Prisma users: add to `prisma/schema.prisma` before migrations:
```prisma
model User {
	id        String   @id @default(cuid())
	email     String   @unique
	password  String
	createdAt DateTime @default(now())
}
```

---

## 🗄️ Database Layers
| Choice | Added Artifacts | Notes |
| ------ | --------------- | ----- |
| MongoDB | `src/models/db.(js|ts)` + Mongoose user model (if auth) | Connect via `DATABASE_URL` or defaults to local instance |
| PostgreSQL / MySQL | `prisma/schema.prisma` + `src/prismaClient.(js|ts)` | Needs `DATABASE_URL` and `npx prisma migrate dev` (after adding models) |
| None | In‑memory placeholder | Suitable only for demos/tests |

---

## 🔧 Environment Variables
Generated `.env.example` (copy to `.env`):
```
PORT=3000
JWT_SECRET=change_me
DATABASE_URL=your_connection_string
```
Mongo default (if not provided): `mongodb://localhost:27017/<project>`

---

## 🧩 Non‑Interactive Flags
Flags map to prompts:
* `--language <javascript|typescript>`
* `--database <mongodb|postgresql|mysql|none>`
* `--auth` / `--no-auth`
* `--name <pkg-name>` (sets project & package name)
* `-y, --yes` (skip all prompts)

Example:
```bash
npx ignite-backend new-service --yes --language ts --database mongodb --auth
```

---

## 🛠️ After Generation (Checklist)
1. `cd <project>`
2. `npm install`
3. If Prisma: add models → `npx prisma migrate dev`
4. Create `.env` from `.env.example`
5. Run dev server: `npm run dev`

---

## 🧪 Testing the CLI Locally (Contributors)
From this repository root:
```bash
npm pack --dry-run        # Inspect contents
npm link                  # Optional: global link
ignite-backend my-test-api
```

---

## 🚢 Release Channels
| Channel | Tag | Install Command |
| ------- | --- | --------------- |
| Stable | `latest` | `npm create ignite-backend@latest` |
| Beta | `beta` | `npm create ignite-backend@beta` |

Publish beta:
```bash
npm run release:beta
```

Promote to stable (example):
```bash
npm version 1.0.0
npm publish --access public
```

---

## 🤝 Contributing
1. Fork & branch: `feat/<short-desc>`
2. Make changes + add/adjust template files
3. Update docs if behavior changes
4. Run local smoke test (see above)
5. Open PR with clear summary

Ideas / Issues: use the GitHub issue tracker.

---

## ❓ Troubleshooting
| Problem | Cause | Fix |
| ------- | ----- | --- |
| Command not found after global install | PATH / npm link issue | Use `npx` or reinstall with latest Node LTS |
| Prisma errors | Missing model / env var | Add `User` model & set `DATABASE_URL` |
| Mongo connection refused | Service not running | Start local Mongo or supply connection string |
| JWT always invalid | Wrong secret mismatch | Ensure same `JWT_SECRET` for issuing & verifying |

---

## 📄 License
MIT © Contributors

---

Enjoy building. If this saves you time, consider starring the repo to help others discover it.
