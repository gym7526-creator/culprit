import { common, format, formatDay, pdfCopy, revealCopy } from '@/copy';
import { content } from '@/data/content';
import { diffDays, type DayKey } from '@/engines/dates';
import type { ProgramState } from '@/engines/program';
import type { CheckIn } from '@/engines/types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const testName = (g: string) => content.tests.tests.find((t) => t.id === g)?.name ?? g;

/**
 * The doctor report (spec §10.5) as print-ready HTML for expo-print: profile summary, timeline,
 * every test with doses, results and confidence, and the disclaimer. No identifying details.
 */
export function doctorReportHtml(
  program: ProgramState,
  checkins: Readonly<Record<DayKey, CheckIn>>,
  today: DayKey,
): string {
  const start = program.calmStartedOn ?? today;
  const days = Math.max(1, diffDays(start, today) + 1);
  const logged = Object.keys(checkins).filter((d) => d >= start && d <= today).length;
  const calmEnd = program.calmEndedOn ?? today;
  const rows = program.completed
    .filter((t) => t.result)
    .map((t) => {
      const r = t.result!;
      const def = content.tests.tests.find((d) => d.id === t.group);
      const doses = t.doseDays
        .map((d, i) => `${formatDay(d, 'short')}: ${def?.doses[i]?.portion ?? ''}`)
        .join('<br>');
      const label = t.kind === 'control' ? pdfCopy.placebo : testName(t.group);
      return `<tr><td>${esc(label)}</td><td>${esc(`${formatDay(t.startedOn, 'short')} – ${formatDay(t.endedOn, 'short')}`)}</td><td>${doses}</td><td>${esc(revealCopy.verdict[r.outcome])}</td><td>${esc(r.confidence ? revealCopy.confidence[r.confidence] : '–')}</td><td>${esc(r.explanation)}</td></tr>`;
    })
    .join('');
  const self = program.selfReported
    .map(
      (g) =>
        `<tr><td>${esc(testName(g))}</td><td>–</td><td>–</td><td>${esc(revealCopy.verdict.self_reported)}</td><td>–</td><td></td></tr>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(pdfCopy.title)}</title>
<style>
body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1C1C22;margin:32px;font-size:12px;line-height:1.45}
h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;vertical-align:top;text-align:left}
th{background:#f4f2fb}.muted{color:#555}.disclaimer{margin-top:24px;padding:10px;background:#f7f7f7;border-radius:6px}
</style></head><body>
<h1>${esc(pdfCopy.title)}</h1>
<div class="muted">${esc(format(pdfCopy.generated, { date: formatDay(today) }))}</div>
<h2>${esc(pdfCopy.profile)}</h2>
<p>${esc(format(pdfCopy.profileLine, { profile: pdfCopy.profiles[program.profile], calmStart: formatDay(start, 'short'), calmEnd: formatDay(calmEnd, 'short'), days: program.calmDaysDone }))}</p>
<h2>${esc(pdfCopy.timeline)}</h2>
<p>${esc(format(pdfCopy.checkins, { count: logged, days }))} ${esc(pdfCopy.scale)}</p>
<h2>${esc(pdfCopy.tests)}</h2>
<table><thead><tr>${pdfCopy.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows}${self}</tbody></table>
<div class="disclaimer">${esc(common.disclaimer)}</div>
</body></html>`;
}
