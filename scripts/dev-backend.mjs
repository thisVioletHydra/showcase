import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'backend');
const restartDelayMs = 400;
let stopping = false;
let activeChild = null;

function start() {
  if (stopping) {
    return;
  }

  activeChild = spawn('pnpm', ['exec', 'tsx', 'watch', 'src/main.ts'], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: process.env,
  });

  activeChild.on('exit', (code, signal) => {
    activeChild = null;
    if (stopping) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[dev-backend] process exited (${reason}), restart in ${restartDelayMs}ms…`);
    setTimeout(start, restartDelayMs);
  });
}

function shutdown() {
  stopping = true;
  if (activeChild) {
    activeChild.kill('SIGINT');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
