import axe from 'axe-core';

/** Runs axe on a rendered container; returns violation summaries so a failing test shows what broke. */
export async function axeViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    rules: {
      // jsdom has no layout or computed colours; contrast is checked in tokens (Design §3.1) and in the browser.
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`);
}
