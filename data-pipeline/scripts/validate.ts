/**
 * Validates the bundled content in /assets/data and prints the coverage report.
 * Exits non-zero on any schema error, integrity problem or unmet coverage rule.
 * Usage: npm run content:validate
 */
import { checkContent } from '../lib/coverage.ts';
import { loadContent } from '../lib/load.ts';

function loadOrExit(): ReturnType<typeof loadContent> {
  try {
    return loadContent();
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}

const content = loadOrExit();
const { errors, warnings, report } = checkContent(content);
console.log(
  `Culprit content ${content.manifest.contentVersion} (built ${content.manifest.builtAt})\n`,
);
console.log(report.join('\n'));
if (warnings.length > 0) console.log(`\nWarnings:\n  ${warnings.join('\n  ')}`);
if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('\n✓ Content is valid.');
