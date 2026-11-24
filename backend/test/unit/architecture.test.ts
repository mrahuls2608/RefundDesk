import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/** ArchUnit-style module rules (TRD §3.1, Rules §1). Do not weaken these to make code compile. */
const SRC = join(import.meta.dirname, '../../src');

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : path.endsWith('.ts') ? [path] : [];
  });
}

function importsOf(file: string, { runtimeOnly = false } = {}): string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/(?:import|export)\s+(type\s)?[^'"]*?from\s+['"]([^'"]+)['"]/g)]
    .filter((m) => !(runtimeOnly && m[1]))
    .map((m) => m[2]!);
}

const rel = (file: string) => relative(SRC, file).replaceAll('\\', '/');
const filesIn = (module: string) => filesUnder(join(SRC, module));

function violations(module: string, forbidden: RegExp, options = {}): string[] {
  return filesIn(module).flatMap((file) =>
    importsOf(file, options).filter((spec) => forbidden.test(spec)).map((spec) => `${rel(file)} → ${spec}`),
  );
}

describe('architecture rules', () => {
  it('agent never depends on refund or casemgmt (the AI is read-only)', () => {
    expect(violations('modules/agent', /\/(refund|casemgmt|audit)\//)).toEqual([]);
  });

  it('agent never imports Mongoose models at runtime (types only)', () => {
    expect(violations('modules/agent', /\.model\.js$|mongoose/, { runtimeOnly: true })).toEqual([]);
  });

  it('refund never depends on agent or casemgmt', () => {
    expect(violations('modules/refund', /\/(agent|casemgmt)\//)).toEqual([]);
  });

  it('security depends only on user, common and config', () => {
    expect(violations('security', /modules\/(?!user\/)/)).toEqual([]);
  });

  it('only DecisionService executes refunds (no refund without human approval)', () => {
    const callers = filesUnder(SRC)
      .filter((file) => /refundService\.execute\(/.test(readFileSync(file, 'utf8')))
      .map(rel);
    expect(callers).toEqual(['modules/casemgmt/decision.service.ts']);
  });

  it('case status is only written through caseTransitions (plus creation)', () => {
    const writers = filesUnder(SRC)
      .filter((file) => /\$set:\s*\{\s*status/.test(readFileSync(file, 'utf8')))
      .map(rel);
    expect(writers).toEqual(['modules/casemgmt/caseTransitions.ts']);
  });

  it('routes never touch Mongoose models directly', () => {
    const offenders = filesUnder(SRC)
      .filter((file) => file.endsWith('.routes.ts'))
      .flatMap((file) => importsOf(file).filter((s) => s.endsWith('.model.js')).map((s) => `${rel(file)} → ${s}`));
    expect(offenders).toEqual([]);
  });

  it('money is never parsed with parseFloat', () => {
    const offenders = filesUnder(SRC).filter((file) => /parseFloat\(/.test(readFileSync(file, 'utf8'))).map(rel);
    expect(offenders).toEqual([]);
  });
});
