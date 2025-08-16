#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fse from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_ROOT = path.resolve(__dirname, '..', 'templates');

const QUESTIONS = [
    {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        validate: (v) => /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-zA-Z0-9-_][a-zA-Z0-9-_.]*$/.test(v) || 'Enter a valid npm package name.'
    },
    {
        type: 'list',
        name: 'language',
        message: 'Language:',
        choices: ['JavaScript', 'TypeScript'],
        default: 'TypeScript'
    },
    {
        type: 'list',
        name: 'database',
        message: 'Database:',
        choices: ['MongoDB', 'PostgreSQL', 'MySQL', 'None'],
        default: 'None'
    },
    {
        type: 'confirm',
        name: 'auth',
        message: 'Include authentication (JWT)?',
        default: true
    }
];

program
    .name('ignite-backend')
    .description('Scaffold a modern MVC backend (Express) in JS or TS with optional DB & auth.')
    .version('1.0.0')
    .option('--name <name>', 'Project name (non-interactive)')
    .option('--language <language>', 'javascript | typescript')
    .option('--database <db>', 'mongodb | postgresql | mysql | none')
    .option('--auth', 'Include authentication (JWT)')
    .option('--no-auth', 'Exclude authentication (override default)')
    .option('-y, --yes', 'Skip prompts; use flags or defaults')
    .argument('[project-directory]', 'Directory to create the project in')
    .action(async (dirArg) => {
        try {
            console.log(chalk.cyan('\nCreate Backend App CLI'));
            const opts = program.opts();
            let answers;
            if (opts.yes) {
                // Non-interactive mode
                const projectName = opts.name || dirArg || 'backend-app';
                const languageRaw = (opts.language || 'typescript').toLowerCase();
                const databaseRaw = (opts.database || 'none').toLowerCase();
                const langMap = { javascript: 'JavaScript', js: 'JavaScript', typescript: 'TypeScript', ts: 'TypeScript' };
                const dbMap = { mongodb: 'MongoDB', postgres: 'PostgreSQL', postgresql: 'PostgreSQL', mysql: 'MySQL', none: 'None' };
                const language = langMap[languageRaw];
                const database = dbMap[databaseRaw];
                if (!language) {
                    console.error(chalk.red('Invalid --language value. Use javascript|typescript'));
                    process.exit(1);
                }
                if (!database) {
                    console.error(chalk.red('Invalid --database value. Use mongodb|postgresql|mysql|none'));
                    process.exit(1);
                }
                const auth = opts.auth === true ? true : (opts.auth === false ? false : !!opts.auth || (!('auth' in opts) && !('noAuth' in opts) ? false : false));
                // If user gave --auth it's true; if --no-auth it's false; default in non-interactive is false
                answers = { projectName, language, database, auth };
            } else {
                // Interactive mode, but pre-fill defaults from flags if provided
                const baseAnswers = await inquirer.prompt(QUESTIONS.map(q => {
                    if (q.name === 'projectName' && program.opts().name) return { ...q, default: program.opts().name };
                    if (q.name === 'language' && program.opts().language) return { ...q, default: (/ts/i.test(program.opts().language) ? 'TypeScript' : 'JavaScript') };
                    if (q.name === 'database' && program.opts().database) {
                        const dbRaw = program.opts().database.toLowerCase();
                        const dbMap = { mongodb: 'MongoDB', postgres: 'PostgreSQL', postgresql: 'PostgreSQL', mysql: 'MySQL', none: 'None' };
                        return { ...q, default: dbMap[dbRaw] || q.default };
                    }
                    if (q.name === 'auth' && (program.opts().auth !== undefined)) return { ...q, default: !!program.opts().auth };
                    return q;
                }));
                answers = baseAnswers;
            }
            const targetDirName = answers.projectName;
            const targetDir = path.resolve(process.cwd(), dirArg || targetDirName);

            if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
                const { overwrite } = await inquirer.prompt([
                    { type: 'confirm', name: 'overwrite', message: 'Target directory not empty. Continue?', default: false }
                ]);
                if (!overwrite) {
                    console.log(chalk.yellow('Aborting.')); return;
                }
            } else {
                await fse.mkdirp(targetDir);
            }

            const langKey = answers.language === 'TypeScript' ? 'ts' : 'js';
            const templatePath = path.join(TEMPLATE_ROOT, langKey);
            const spinner = ora('Copying template...').start();
            await fse.copy(templatePath, targetDir, {
                overwrite: true, errorOnExist: false, filter: (src) => {
                    return true;
                }
            });

            // Feature injections
            await applyFeatureInjections({ targetDir, answers });

            // Replace placeholders across all files (after injections so new files included)
            await replacePlaceholdersRecursive(targetDir, { projectName: targetDirName });

            spinner.succeed('Template copied.');
            console.log(chalk.green('Project created successfully!'));
            console.log(`\nNext steps:\n  cd ${targetDirName}\n  npm install\n  npm run dev\n`);
            if (program.opts().yes) {
                console.log('Non-interactive flags used.');
            }
        } catch (err) {
            console.error(chalk.red('Error:'), err.message || err);
            process.exit(1);
        }
    });

async function applyFeatureInjections({ targetDir, answers }) {
    const { database, auth, language } = answers;
    const isTS = language === 'TypeScript';

    if (database === 'MongoDB') {
        await addMongo(targetDir, isTS);
    } else if (database === 'PostgreSQL' || database === 'MySQL') {
        await addPrisma(targetDir, database, isTS);
    }

    if (auth) {
        await addAuth(targetDir, { db: database, isTS });
        // Inject auth route mounting into app file
        const appFile = path.join(targetDir, isTS ? 'app.ts' : 'app.js');
        if (fs.existsSync(appFile)) {
            let content = fs.readFileSync(appFile, 'utf8');
            if (!content.includes('authRoutes')) {
                const importLine = isTS ? "import authRoutes from './src/routes/authRoutes.js';" : "import authRoutes from './src/routes/authRoutes.js';";
                content = content.replace(/(app.use\('\/api\/examples'.*?;\n)/s, `$1\n// Auth routes\n${importLine}\napp.use('/api/auth', authRoutes);\n`);
                fs.writeFileSync(appFile, content, 'utf8');
            }
        }
    }

    // Update dependencies in package.json
    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = answers.projectName;
    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};

    if (database === 'MongoDB') {
        pkg.dependencies.mongoose = '^8.5.0';
    } else if (database === 'PostgreSQL' || database === 'MySQL') {
        pkg.dependencies['@prisma/client'] = '^5.17.0';
        pkg.devDependencies.prisma = '^5.17.0';
        pkg.scripts.prisma = 'prisma generate';
    }
    if (auth) {
        pkg.dependencies.bcrypt = '^5.1.1';
        pkg.dependencies.jsonwebtoken = '^9.0.2';
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

async function replacePlaceholdersRecursive(rootDir, replacements) {
    const entries = await fse.readdir(rootDir, { withFileTypes: true });
    await Promise.all(entries.map(async (ent) => {
        const full = path.join(rootDir, ent.name);
        if (ent.isDirectory()) return replacePlaceholdersRecursive(full, replacements);
        // Skip node_modules just in case
        if (full.includes('node_modules')) return;
        let content = await fse.readFile(full, 'utf8');
        let changed = false;
        for (const [key, value] of Object.entries(replacements)) {
            const pattern = new RegExp(`{{${key}}}`, 'g');
            if (pattern.test(content)) {
                content = content.replace(pattern, value);
                changed = true;
            }
        }
        if (changed) await fse.writeFile(full, content, 'utf8');
    }));
}

async function addMongo(targetDir, isTS) {
    const modelExt = isTS ? 'ts' : 'js';
    const content = `import mongoose from 'mongoose';\n\nconst connectDB = async () => {\n  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/${'{{projectName}}'}';\n  await mongoose.connect(uri);\n  console.log('MongoDB connected');\n};\n\nexport default connectDB;\n`;
    const dbDir = path.join(targetDir, 'src', 'models');
    await fse.mkdirp(dbDir);
    fs.writeFileSync(path.join(dbDir, `db.${modelExt}`), content, 'utf8');
}

async function addPrisma(targetDir, dbChoice, isTS) {
    const schema = `datasource db {\n  provider = \"${dbChoice === 'MySQL' ? 'mysql' : 'postgresql'}\"\n  url      = env(\"DATABASE_URL\")\n}\n\ngenerator client {\n  provider = \"prisma-client-js\"\n}`;
    const prismaDir = path.join(targetDir, 'prisma');
    await fse.mkdirp(prismaDir);
    fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), schema, 'utf8');
    const utilExt = isTS ? 'ts' : 'js';
    const clientContent = `import { PrismaClient } from '@prisma/client';\nexport const prisma = new PrismaClient();\n`;
    const srcDir = path.join(targetDir, 'src');
    fs.writeFileSync(path.join(srcDir, `prismaClient.${utilExt}`), clientContent, 'utf8');
}

async function addAuth(targetDir, { db, isTS }) {
    const ext = isTS ? 'ts' : 'js';
    const userModelPath = path.join(targetDir, 'src', 'models', `User.${ext}`);
    let userModel = '';
    if (db === 'MongoDB') {
        userModel = `import mongoose from 'mongoose';\nconst userSchema = new mongoose.Schema({\n  email: { type: String, unique: true, required: true },\n  password: { type: String, required: true }\n}, { timestamps: true });\nexport default mongoose.model('User', userSchema);\n`;
    } else if (db === 'PostgreSQL' || db === 'MySQL') {
        userModel = `// Prisma model will be in prisma/schema.prisma\n// Add: model User { id String @id @default(cuid()) email String @unique password String createdAt DateTime @default(now()) }\n`;
    } else {
        userModel = `// In-memory user store fallback\nexport const users = [];\n`;
    }
    fs.writeFileSync(userModelPath, userModel, 'utf8');

    const authController = `import bcrypt from 'bcrypt';\nimport jwt from 'jsonwebtoken';\n${db === 'MongoDB' ? "import User from '../models/User.js';" : db === 'PostgreSQL' || db === 'MySQL' ? "import { prisma } from '../prismaClient.js';" : ''}\nconst JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';\n\nexport const register = async (req, res) => {\n  try {\n    const { email, password } = req.body;\n    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });\n    const hash = await bcrypt.hash(password, 10);\n    ${db === 'MongoDB' ? 'const existing = await User.findOne({ email }); if (existing) return res.status(409).json({ message: "Email taken" }); const user = await User.create({ email, password: hash });' : db === 'PostgreSQL' || db === 'MySQL' ? 'const existing = await prisma.user.findUnique({ where: { email } }); if (existing) return res.status(409).json({ message: "Email taken" }); const user = await prisma.user.create({ data: { email, password: hash } });' : 'const existing = users.find(u => u.email === email); if (existing) return res.status(409).json({ message: "Email taken" }); const user = { id: Date.now().toString(), email, password: hash }; users.push(user);'}\n    return res.status(201).json({ id: user.id, email: user.email });\n  } catch (e) {\n    return res.status(500).json({ message: e.message });\n  }\n};\n\nexport const login = async (req, res) => {\n  try {\n    const { email, password } = req.body;\n    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });\n    ${db === 'MongoDB' ? 'const user = await User.findOne({ email });' : db === 'PostgreSQL' || db === 'MySQL' ? 'const user = await prisma.user.findUnique({ where: { email } });' : 'const user = users.find(u => u.email === email);'}\n    if (!user) return res.status(401).json({ message: 'Invalid credentials' });\n    const match = await bcrypt.compare(password, user.password);\n    if (!match) return res.status(401).json({ message: 'Invalid credentials' });\n    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '1d' });\n    return res.json({ token });\n  } catch (e) {\n    return res.status(500).json({ message: e.message });\n  }\n};\n`;

    const authMiddleware = `import jwt from 'jsonwebtoken';\nconst JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';\nexport const requireAuth = (req, _res, next) => {\n  const header = req.headers.authorization;\n  if (!header) return _res.status(401).json({ message: 'Missing Authorization header' });\n  const token = header.split(' ')[1];\n  try {\n    const payload = jwt.verify(token, JWT_SECRET);\n    req.user = payload;\n    return next();\n  } catch {\n    return _res.status(401).json({ message: 'Invalid token' });\n  }\n};\n`;

    const authRoutes = `import { Router } from 'express';\nimport { register, login } from '../controllers/authController.${ext}';\nconst router = Router();\nrouter.post('/register', register);\nrouter.post('/login', login);\nexport default router;\n`;

    const controllersDir = path.join(targetDir, 'src', 'controllers');
    const routesDir = path.join(targetDir, 'src', 'routes');
    await fse.mkdirp(controllersDir);
    await fse.mkdirp(routesDir);
    fs.writeFileSync(path.join(controllersDir, `authController.${ext}`), authController, 'utf8');
    fs.writeFileSync(path.join(routesDir, `authRoutes.${ext}`), authRoutes, 'utf8');
    fs.writeFileSync(path.join(targetDir, 'src', `authMiddleware.${ext}`), authMiddleware, 'utf8');
}

program.parseAsync(process.argv);
