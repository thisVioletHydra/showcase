import type { Plugin } from 'vite';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join } from 'node:path';
import { cwd } from 'node:process';

function contentHash(filePath: string): string {
  const buffer = readFileSync(filePath);
  return createHash('sha256').update(buffer).digest('hex').slice(0, 4);
}

function scan(publicRoot: string, dir: string) {
  const folder = join(publicRoot, dir);
  if (!existsSync(folder)) {
    return {};
  }

  for (const fileName of readdirSync(folder)) {
    const filePath = join(folder, fileName);
    if (!statSync(filePath).isFile()) {
      continue;
    }

    const extension = extname(fileName);
    basename(fileName, extension);
  }

  return cwd();
}

export function plugin(): Plugin {
  return { name: 'test' };
}
