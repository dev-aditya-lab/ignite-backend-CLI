# ignite-backend

Scaffold a modern MVC backend (Express) in JavaScript or TypeScript with one command.

## Features
- Interactive prompts (project name, language, database, auth)
- MVC folder structure (controllers, models, routes)
- Optional authentication boilerplate (JWT & bcrypt)
- Database adapters: MongoDB (Mongoose), PostgreSQL / MySQL (via Prisma), or none
- Clean Express setup with environment config & scripts
- TypeScript template with nodemon + ts-node-dev
- JavaScript template with nodemon + dotenv

## Quick Start

Using `npm` (recommended):
```bash
npm create ignite-backend@latest
```

Beta channel (pre-release) for testing upcoming changes:
```bash
npm create ignite-backend@beta
```

Direct with `npx`:
```bash
npx ignite-backend@latest
```

Then answer the prompts. A folder with your project name will be created.

### Options
| Prompt | Values | Notes |
| ------ | ------ | ----- |
| Language | JavaScript / TypeScript | TS adds build step |
| Database | MongoDB / PostgreSQL / MySQL / None | SQL uses Prisma; Mongo uses Mongoose |
| Auth | Yes / No | Adds JWT auth, user model, routes |

If SQL + Auth: remember to extend `prisma/schema.prisma` with a User model before running migrations.

## Generated Project Scripts
| Script | JS Template | TS Template |
| ------ | ----------- | ----------- |
| dev    | nodemon server.js | nodemon --watch src --exec ts-node src/server.ts |
| build  | (none) | tsc |
| start  | node server.js | node dist/server.js |

## Environment Variables
Generated `.env` file (if DB/auth selected):
```
PORT=3000
JWT_SECRET=change_me
DATABASE_URL=your_connection_string
``` 
Adjust as needed.

## Authentication Option
If you choose auth:
- Adds `authController` with register/login
- Adds `authMiddleware` (JWT verify)
- Adds `User` model (Mongoose or Prisma schema depending on DB)
- Adds `/api/auth` routes

## Database Option
| Choice | Stack |
| ------ | ----- |
| MongoDB | Mongoose models in `src/models` |
| PostgreSQL / MySQL | Prisma schema + client init |
| None | In-memory placeholder model |

## Placeholders
`{{projectName}}` is replaced automatically in `package.json`, README stub, and app banner.

## Publishing (For Maintainers)
Stable release:
1. Update version in root `package.json` (semver)
2. `npm publish --access public`

Beta / pre-release:
1. Run `npm run release:beta` (increments prerelease e.g. 1.0.0-beta.1 and publishes with `beta` tag)
2. Consumers can install via `npm create ignite-backend@beta` or `npx ignite-backend@beta`
3. Once validated, promote by publishing a normal semver version without preid; optionally `npm dist-tag add ignite-backend@<beta-version> latest` if needed.

## License
MIT
