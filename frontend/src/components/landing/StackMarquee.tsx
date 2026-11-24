const STACK = ['Next.js', 'Express', 'TypeScript', 'MongoDB', 'Redis', 'BullMQ', 'Tailwind CSS', 'TanStack Query', 'Zod', 'Groq', 'Gemini', 'Ollama', 'Vitest', 'Docker'];

/** Constant motion, so linear. Pauses on hover; stops under reduced motion (global rule). */
export function StackMarquee() {
  return (
    <section aria-label="Built with" className="border-y border-border py-8">
      <p className="mb-6 text-center text-sm font-medium text-text-muted">Built in the open with</p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-12 [@media(hover:hover)]:hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 gap-12">
              {STACK.map((name) => (
                <li key={name} className="whitespace-nowrap text-xl font-semibold text-text-muted">
                  {name}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
