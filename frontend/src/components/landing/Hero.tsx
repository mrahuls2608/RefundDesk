import { ArrowRight, PlayCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { HeroDemo } from "./HeroDemo";
import { HexPattern } from "./HexPattern";

/** Broken where the thought breaks, not where the column happens to end. */
const HEADLINE_LINES = [
  "Payment disputes",
  "resolved in minutes.",
  "Every refund",
  "paid exactly once.",
];
const LINE_STAGGER_MS = 80;
const BUILT_WITH = ["MongoDB", "Redis", "Next.js", "Express", "Groq", "Gemini"];

/** Above the fold, inside a forest panel: outcome headline, one CTA, one proof signal, the product itself. */
export function Hero() {
  return (
    <div className="px-2 pt-2 sm:px-4 sm:pt-4">
      <section
        aria-labelledby="hero-title"
        className="relative isolate overflow-hidden rounded-3xl bg-forest-900 text-forest-on"
      >
        <HexPattern className="-left-16 top-24 w-56 sm:w-72" />
        <HexPattern className="-right-20 bottom-0 w-64 [animation-delay:-9s] sm:w-80" />
        <div
          aria-hidden="true"
          className="absolute right-[12%] top-1/3 -z-10 h-80 w-80 animate-glow rounded-full bg-accent opacity-20 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-40">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-forest-line bg-forest-800 px-3 py-1 text-xs font-medium text-forest-muted">
              <ShieldCheck
                aria-hidden="true"
                className="h-3.5 w-3.5 text-accent"
              />
              AI investigates · humans approve · money moves once
            </p>
            <h1
              id="hero-title"
              className="w-full max-w-[680px] text-3xl font-semibold tracking-tight min-[400px]:text-4xl sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl"
            >
              {HEADLINE_LINES.map((line, index) => (
                <span
                  key={line}
                  style={{
                    animationDelay: `${100 + index * LINE_STAGGER_MS}ms`,
                  }}
                  className="block w-max max-w-full animate-rise bg-[linear-gradient(90deg,var(--color-hero-from),var(--color-hero-to))] bg-clip-text pb-1 text-transparent"
                >
                  {line}
                </span>
              ))}
            </h1>
            <p
              style={{ animationDelay: "420ms" }}
              className="max-w-[680px] animate-rise text-lg text-forest-muted text-pretty"
            >
              RefundDesk gives support teams an AI investigator that gathers the
              facts and proposes an outcome, while a person approves every
              rupee. Refunds run through one idempotent path, so a double click
              can never pay twice.
            </p>
            <div
              style={{ animationDelay: "500ms" }}
              className="flex animate-rise flex-col items-start gap-3"
            >
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-base font-semibold text-accent-on shadow-glow transition-[transform,background-color] duration-150 ease-out hover:bg-accent-strong active:scale-[0.97]"
                >
                  Try the live demo
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
                  />
                </Link>
                <a
                  href="#demo-video"
                  className="inline-flex min-h-touch items-center gap-2 text-base font-semibold text-forest-on underline-offset-4 transition-colors duration-150 hover:text-accent hover:underline"
                >
                  <PlayCircle
                    aria-hidden="true"
                    className="h-5 w-5 text-accent"
                  />
                  Watch the 2 minute demo
                </a>
              </div>
              <p className="text-sm text-forest-muted">
                No signup. Five demo accounts, one password.
              </p>
            </div>
            <div
              style={{ animationDelay: "580ms" }}
              className="flex animate-rise flex-col gap-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-muted">
                Built in the open with
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {BUILT_WITH.map((name) => (
                  <li
                    key={name}
                    className="text-base font-semibold text-forest-on opacity-80"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            style={{ animationDelay: "300ms" }}
            className="min-w-0 animate-rise"
          >
            <HeroDemo />
          </div>
        </div>
      </section>
    </div>
  );
}
