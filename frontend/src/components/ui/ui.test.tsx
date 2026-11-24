import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import {
  AIProposalCard, AmountCard, Banner, Button, ConfidenceMeter, EmptyState, FilterChips, Input, Modal, RadioGroup, Select,
  SortableTh, StatusBadge, StatusTimeline, Stepper, Table, Tabs, Td, Textarea, TransactionRow,
} from './index';

describe('Button', () => {
  it('keeps its label and sets aria-busy while loading', async () => {
    const { container } = render(<Button loading>Approve</Button>);
    const button = screen.getByRole('button', { name: 'Approve' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('fires onClick from the keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Submit</Button>);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('form fields', () => {
  it('links the error to the input with aria-describedby', async () => {
    const { container } = render(<Input label="Email" error="Enter a valid email" value="" onChange={() => undefined} />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('shows a character counter on Textarea', async () => {
    const { container } = render(<Textarea label="Tell us more" value="hello" maxLength={1000} onChange={() => undefined} />);
    expect(screen.getByText('5 / 1000')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('labels Select', async () => {
    const { container } = render(<Select label="Type" options={[{ value: 'a', label: 'A' }]} />);
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('RadioGroup selects with the keyboard and reports errors', async () => {
    function Harness() {
      const [value, setValue] = useState<'a' | 'b' | ''>('');
      return (
        <RadioGroup legend="What went wrong?" name="issue" value={value} onChange={setValue} error={value ? undefined : 'Choose one'}
          options={[{ value: 'a', label: 'Charged twice' }, { value: 'b', label: 'Wrong amount' }]} />
      );
    }
    const { container } = render(<Harness />);
    expect(screen.getByRole('group', { name: 'What went wrong?' })).toHaveAccessibleDescription('Choose one');
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByLabelText('Wrong amount'));
    expect(screen.getByLabelText('Wrong amount')).toBeChecked();
  });
});

describe('StatusBadge', () => {
  it('always shows text, not just colour', async () => {
    const { container } = render(<StatusBadge audience="staff" status="NEEDS_MANUAL_REVIEW" />);
    expect(screen.getByText('Manual review')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('uses customer wording', () => {
    render(<StatusBadge audience="customer" status="In review" />);
    expect(screen.getByText('In review')).toBeInTheDocument();
  });
});

describe('StatusTimeline', () => {
  it('is an ordered list with aria-current on the current step', async () => {
    const { container } = render(
      <StatusTimeline
        steps={[
          { key: 'r', label: 'Received', state: 'done', at: '2026-11-20T13:10:00Z' },
          { key: 'i', label: 'In review', state: 'current' },
          { key: 'd', label: 'Decision', state: 'upcoming' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('money and AI components', () => {
  it('AmountCard shows formatted INR and "Not refunded" when muted', async () => {
    const { container } = render(<AmountCard label="Requested amount" amount={499} variant="muted" />);
    expect(screen.getByText('₹499.00')).toBeInTheDocument();
    expect(screen.getByText('Not refunded')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('ConfidenceMeter exposes the value as text', async () => {
    const { container } = render(<ConfidenceMeter value={0.92} />);
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Confidence' })).toHaveAttribute('aria-valuenow', '92');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('AIProposalCard labels AI output as needing approval', async () => {
    const { container } = render(
      <AIProposalCard
        state="proposal"
        proposal={{ action: 'FULL_REFUND', amount: 499, confidence: 0.92, reasons: ['Identical charge 40 s earlier'], createdBy: 'AGENT', model: 'm', promptVersion: 'v1', createdAt: '' }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'AI proposal — needs human approval' })).toBeInTheDocument();
    expect(screen.getByText('Identical charge 40 s earlier')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('AIProposalCard failed variant offers a re-run', async () => {
    const onRerun = vi.fn();
    const { container } = render(<AIProposalCard state="failed" onRerun={onRerun} />);
    await userEvent.click(screen.getByRole('button', { name: 'Re-run AI' }));
    expect(onRerun).toHaveBeenCalled();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('TransactionRow has a single action and no nested interactives', async () => {
    const { container } = render(
      <TransactionRow merchant="FoodNow" amount={499} createdAt="2026-11-20T13:05:10Z" status="SUCCESS" hasOpenCase action={<button type="button">View case</button>} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByText('Case open')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Banner', () => {
  it('uses role=alert for errors and role=status otherwise', () => {
    render(
      <>
        <Banner variant="danger">Failed</Banner>
        <Banner variant="info">FYI</Banner>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getByRole('status')).toHaveTextContent('FYI');
  });
});

describe('Modal', () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <Modal open={open} title="Reject this request?" onClose={() => setOpen(false)} footer={<button type="button">Confirm</button>}>
          <label htmlFor="reason">Reason</label>
          <textarea id="reason" />
        </Modal>
      </>
    );
  }

  it('focuses the first field, traps Tab, closes on Esc and restores focus', async () => {
    const { container } = render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Reject this request?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toHaveFocus();
    expect(await axeViolations(container)).toEqual([]);

    await userEvent.tab(); // → Confirm (last)
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
    await userEvent.tab(); // wraps → Close (first)
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('Tabs', () => {
  it('moves between tabs with arrow keys', async () => {
    function Harness() {
      const [value, setValue] = useState<'a' | 'b'>('a');
      return <Tabs label="Activity" value={value} onChange={setValue} tabs={[{ value: 'a', label: 'Timeline', content: 'T' }, { value: 'b', label: 'Audit log', content: 'A' }]} />;
    }
    const { container } = render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Audit log' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Audit log' })).toHaveFocus();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('FilterChips, Table and EmptyState', () => {
  it('FilterChips are toggle buttons with aria-pressed', async () => {
    const onSelect = vi.fn();
    const { container } = render(<FilterChips label="Status" selected="a" onSelect={onSelect} chips={[{ value: 'a', label: 'All' }, { value: 'p', label: 'Proposed', count: 4 }]} />);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Proposed 4' }));
    expect(onSelect).toHaveBeenCalledWith('p');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('sortable headers expose aria-sort', async () => {
    const { container } = render(
      <Table caption="Cases">
        <thead>
          <tr>
            <SortableTh label="Age" direction="descending" onSort={() => undefined} />
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>35m</Td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('EmptyState renders title', async () => {
    const { container } = render(<EmptyState title="No cases need action right now." />);
    expect(screen.getByText('No cases need action right now.')).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Stepper', () => {
  it('announces position and marks the current step', async () => {
    const { container } = render(
      <Stepper
        label="Case lifecycle"
        steps={[
          { key: 'a', label: 'Received', state: 'done' },
          { key: 'b', label: 'Investigate', state: 'current' },
          { key: 'c', label: 'Decision', state: 'upcoming' },
        ]}
      />,
    );
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Case lifecycle' }).tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('(completed)', { exact: false })).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it('reports the last step when everything is done', () => {
    render(<Stepper steps={[{ key: 'a', label: 'One', state: 'done' }, { key: 'b', label: 'Two', state: 'done' }]} />);
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });
});
