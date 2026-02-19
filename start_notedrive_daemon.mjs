import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const APP_DIR = path.join(ROOT_DIR, 'notedrive');
const LOG_DIR = path.join(ROOT_DIR, 'logs');
const PID_FILE = path.join(LOG_DIR, 'notedrive.pid');
const SERVER_LOG = path.join(LOG_DIR, 'notedrive_server.log');
const PORT = process.env.NOTEDRIVE_PORT || '9002';

const NODE_BIN = process.execPath;
const NEXT_BIN = path.join(APP_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');
const NPM_BIN_CANDIDATES = ['/opt/homebrew/bin/npm', '/usr/local/bin/npm'];

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(NEXT_BIN)) {
  process.stderr.write(`next binary not found: ${NEXT_BIN}\n`);
  process.exit(1);
}

const out = fs.openSync(SERVER_LOG, 'a');
const env = {
  ...process.env,
  PATH: `/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH || ''}`,
};

function runAndWait(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, options);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function resolveNpmBin() {
  for (const candidate of NPM_BIN_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'npm';
}

async function ensureBuild() {
  const nextDir = path.join(APP_DIR, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
  const npmBin = resolveNpmBin();
  fs.writeSync(out, `[${new Date().toISOString()}] BUILD: clean + npm run build\n`);
  await runAndWait(npmBin, ['run', 'build'], {
    cwd: APP_DIR,
    stdio: ['ignore', out, out],
    env: { ...env, NEXT_DISABLE_TURBOPACK: '1' },
  });
}

await ensureBuild();

const child = spawn(NODE_BIN, [NEXT_BIN, 'start', '-p', PORT], {
  cwd: APP_DIR,
  detached: true,
  stdio: ['ignore', out, out],
  env,
});

child.unref();
fs.writeFileSync(PID_FILE, String(child.pid), 'utf-8');
