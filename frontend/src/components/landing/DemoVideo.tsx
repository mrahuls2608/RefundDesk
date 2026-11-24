'use client';

import { PlayCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { cx } from '@/components/ui';
import { AccentWords } from './AccentWords';
import recordedChapters from './demo-chapters.json';
import { Reveal } from './Reveal';

interface Chapter {
  time: number;
  title: string;
}

const VIDEO_SRC = '/demo.mp4';
const POSTER_SRC = '/demo-poster.jpg';

function formatTime(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * The recorded end to end demo. Never autoplays (data, attention and reduced motion); native
 * controls give play, pause and seek. Chapters are written by the demo recorder from its own captions
 * and bundled at build time, so they always match the committed video.
 */
export function DemoVideo({ chapters = recordedChapters as Chapter[] }: { chapters?: Chapter[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(-1);

  const onTimeUpdate = () => {
    const time = videoRef.current?.currentTime ?? 0;
    let index = -1;
    chapters.forEach((chapter, i) => {
      if (chapter.time <= time) index = i;
    });
    setCurrent(index);
  };

  const jumpTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    void video.play().catch(() => undefined);
  };

  return (
    <section id="demo-video" aria-labelledby="demo-video-title" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Reveal className="mx-auto mb-12 max-w-[680px] text-center">
        <p className="mb-3 text-sm font-semibold text-primary-600">Demo video</p>
        <h2 id="demo-video-title" className="mb-4 text-3xl font-semibold tracking-tight text-text text-balance sm:text-5xl">
          See it end to end in <AccentWords>under 2 minutes</AccentWords>
        </h2>
        <p className="text-lg text-text-muted text-pretty">
          Recorded automatically against the real app: a customer reports a double charge, the AI proposes, a person approves and the
          refund is paid once.
        </p>
      </Reveal>
      <Reveal delay={120} className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-2 shadow-lg">
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            controls
            muted
            playsInline
            preload="none"
            onTimeUpdate={onTimeUpdate}
            aria-describedby="demo-video-note"
            className="aspect-[16/10] w-full rounded-lg bg-forest-950"
          >
            Your browser cannot play this video. <a href={VIDEO_SRC}>Download the demo video</a>.
          </video>
          <p id="demo-video-note" className="px-2 pb-1 pt-3 text-xs text-text-muted">
            Silent, with on screen captions describing every step.
          </p>
        </div>
        {chapters.length > 0 && (
          <nav aria-label="Video chapters" className="min-w-0 rounded-2xl border border-border bg-surface p-2 shadow-sm">
            <p className="px-3 pb-2 pt-2 text-sm font-semibold text-text">Chapters</p>
            <ol className="flex max-h-[24rem] flex-col gap-1 overflow-y-auto">
              {chapters.map((chapter, index) => (
                <li key={`${chapter.time}-${chapter.title}`}>
                  <button
                    type="button"
                    onClick={() => jumpTo(chapter.time)}
                    aria-current={index === current ? 'true' : undefined}
                    className={cx(
                      'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ease-out',
                      index === current ? 'bg-primary-50 text-text' : 'text-text-muted hover:bg-bg hover:text-text',
                    )}
                  >
                    <span className="tabular font-mono text-xs leading-5 text-primary-600">{formatTime(chapter.time)}</span>
                    <span className="flex-1 text-pretty">{chapter.title}</span>
                    {index === current && <PlayCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </Reveal>
    </section>
  );
}
