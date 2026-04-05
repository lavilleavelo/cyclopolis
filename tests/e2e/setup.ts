import { type ChildProcess, spawn } from 'node:child_process';
import { chromium, type Browser, type Page } from 'playwright-core';
import { afterAll, beforeAll } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = resolve(rootDir, '.output/public');

let serverProcess: ChildProcess;
let browser: Browser;
let baseURL: string;

export function setupE2E() {
  beforeAll(async () => {
    const port = 3333 + Math.floor(Math.random() * 1000);
    baseURL = `http://localhost:${port}`;

    serverProcess = spawn('npx', ['serve', outputDir, '-l', String(port), '--no-clipboard'], {
      stdio: 'pipe',
      cwd: rootDir,
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server start timeout')), 10_000);
      serverProcess.stdout?.on('data', (data: Buffer) => {
        if (data.toString().includes('Accepting connections')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      serverProcess.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString();
        if (msg.includes('Accepting connections')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    browser = await chromium.launch({ headless: true });
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
    serverProcess?.kill();
  });

  return {
    getBaseURL: () => baseURL,
    createPage: async (path: string): Promise<Page> => {
      const page = await browser.newPage();
      await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
      return page;
    },
    fetchHTML: async (path: string): Promise<string> => {
      const response = await fetch(`${baseURL}${path}`);
      return response.text();
    },
  };
}
