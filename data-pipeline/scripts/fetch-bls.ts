/**
 * Monthly refresh: fetches the latest BLS Average Price observations for every candidate series
 * (US average + the four regions) and writes data-pipeline/source/bls-prices.json. Run
 * `npm run content:build` afterwards to apply it.
 *
 * Usage: BLS_API_KEY=... npm run content:prices   (the key is optional; it raises the daily limit)
 * API docs: https://www.bls.gov/developers/
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { regionalSeries, type BlsSnapshot } from '../lib/bls.ts';
import { blsCandidates } from '../source/places.ts';

type BlsResponse = {
  status: string;
  message?: string[];
  Results?: {
    series: { seriesID: string; data: { year: string; period: string; value: string }[] }[];
  };
};

const national = Object.values(blsCandidates).map((c) => c.series);
const all = [
  ...national,
  ...national.flatMap((s) =>
    (['northeast', 'midwest', 'south', 'west'] as const).map((r) => regionalSeries(s, r)),
  ),
];

const year = new Date().getFullYear();
const observations: BlsSnapshot['observations'] = {};

// The public API accepts up to 50 series per request.
for (let i = 0; i < all.length; i += 50) {
  const batch = all.slice(i, i + 50);
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid: batch,
      startyear: String(year - 1),
      endyear: String(year),
      ...(process.env.BLS_API_KEY ? { registrationkey: process.env.BLS_API_KEY } : {}),
    }),
  });
  if (!res.ok) {
    console.error(`BLS request failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const body = (await res.json()) as BlsResponse;
  if (body.status !== 'REQUEST_SUCCEEDED') {
    console.error(`BLS error: ${body.message?.join(' ') ?? body.status}`);
  }
  for (const s of body.Results?.series ?? []) {
    // Latest monthly observation (data is newest-first); skip annual averages ("M13").
    const latest = s.data.find((d) => /^M(0[1-9]|1[0-2])$/.test(d.period) && Number(d.value) > 0);
    if (latest) {
      observations[s.seriesID] = {
        value: Number(latest.value),
        period: `${latest.year}-${latest.period.slice(1)}`,
      };
    }
  }
}

const missing = all.filter((s) => !(s in observations));
const snapshot: BlsSnapshot = { fetchedAt: new Date().toISOString(), observations };
writeFileSync(
  join(import.meta.dirname, '..', 'source', 'bls-prices.json'),
  `${JSON.stringify(snapshot, null, 1)}\n`,
);
console.log(`Fetched ${Object.keys(observations).length}/${all.length} series.`);
if (missing.length > 0)
  console.log(`No data for: ${missing.join(', ')} (those items keep their estimates).`);
console.log('Now run: npm run content:build');
