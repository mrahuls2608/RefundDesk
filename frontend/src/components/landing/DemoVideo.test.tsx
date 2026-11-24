import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import { DemoVideo } from './DemoVideo';

const CHAPTERS = [
  { time: 0, title: 'RefundDesk overview' },
  { time: 31.5, title: 'Asha reports a double charge' },
];

describe('DemoVideo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => CHAPTERS })));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('never autoplays and offers native controls', () => {
    const { container } = render(<DemoVideo />);
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('controls');
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('preload', 'none');
  });

  it('jumps to a chapter and plays from there', async () => {
    const { container } = render(<DemoVideo />);
    const chapter = await screen.findByRole('button', { name: /Asha reports a double charge/ });
    expect(screen.getByText('0:31')).toBeInTheDocument();
    await userEvent.click(chapter);
    expect(container.querySelector('video')!.currentTime).toBe(31.5);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('still shows the video when chapters are unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    const { container } = render(<DemoVideo />);
    await waitFor(() => expect(container.querySelector('video')).toBeInTheDocument());
    expect(screen.queryByRole('navigation', { name: 'Video chapters' })).not.toBeInTheDocument();
  });
});
