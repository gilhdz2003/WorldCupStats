import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGOS_DIR = join(ROOT, 'public', 'logos');

const teams = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'teams.json'), 'utf-8'));

if (!existsSync(LOGOS_DIR)) {
  mkdirSync(LOGOS_DIR, { recursive: true });
}

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const team of teams) {
  const localPath = join(LOGOS_DIR, `${team.slug}.png`);

  if (existsSync(localPath)) {
    skipped++;
    continue;
  }

  const codes = [team.slug, team.abbreviation.toLowerCase()];
  let success = false;

  for (const code of codes) {
    const url = `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const { writeFileSync } = await import('node:fs');
        writeFileSync(localPath, buf);
        console.log(`  Downloaded: ${team.name} -> ${code}.png`);
        downloaded++;
        success = true;
        break;
      }
    } catch {}
  }

  if (!success) {
    console.log(`  FAILED: ${team.name} (${team.slug})`);
    failed++;
  }
}

console.log(`\nDone: ${downloaded} downloaded, ${skipped} existing, ${failed} failed`);
