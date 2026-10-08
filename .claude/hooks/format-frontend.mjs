#!/usr/bin/env node
/**
 * PostToolUse (Edit|Write|MultiEdit): formats the touched frontend file with the project's Prettier config.
 * Silent no-op for anything outside frontend/src or when Prettier is not installed yet.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Accepts Windows (D:\x), POSIX and Git-Bash (/d/x) paths alike. */
function toNative(p) {
  if (process.platform === 'win32' && /^\/[a-zA-Z]\//.test(p)) p = `${p[1]}:${p.slice(2)}`;
  return path.resolve(p);
}

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const projectDir = toNative(process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd());
const frontendDir = path.join(projectDir, 'frontend');
const relative = path.relative(frontendDir, toNative(filePath));

const inFrontendSrc = !relative.startsWith('..') && relative.split(path.sep)[0] === 'src';
if (!inFrontendSrc || !/\.(ts|html|scss|css)$/.test(filePath)) process.exit(0);

const prettierBin = path.join(frontendDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs');
if (!existsSync(prettierBin)) process.exit(0);

try {
  execFileSync(process.execPath, [prettierBin, '--write', '--log-level', 'warn', relative], { cwd: frontendDir, stdio: 'pipe' });
} catch (error) {
  // Report but don't block: a syntax error will surface in the build anyway.
  process.stderr.write(`prettier could not format ${relative}: ${error.stderr?.toString() ?? error.message}\n`);
}
