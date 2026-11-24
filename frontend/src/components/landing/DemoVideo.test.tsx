import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import { DemoVideo } from './DemoVideo';

const CHAPTERS = [
  { time: 0, title: 'RefundDesk overview' },
  { time: 31.5, title: 'Asha reports a double charge' },
];

describe('DemoVideo', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  it('never autoplays and offers native controls', () => {
    const { container } = render(<DemoVideo chapters={CHAPTERS} />);
    const video = container.querySelector('video')!;
    expect(video).toHaveAttribute('controls');
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('preload', 'none');
  });

  it('jumps to a chapter and plays from there', async () => {
    const { container } = render(<DemoVideo chapters={CHAPTERS} />);
    const chapter = await screen.findByRole('button', { name: /Asha reports a double charge/ });
    expect(screen.getByText('0:31')).toBeInTheDocument();
    await userEvent.click(chapter);
    expect(container.querySelector('video')!.currentTime).toBe(31.5);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('still shows the video when there are no chapters yet', () => {
    const { container } = render(<DemoVideo chapters={[]} />);
    expect(container.querySelector('video')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Video chapters' })).not.toBeInTheDocument();
  });
});
