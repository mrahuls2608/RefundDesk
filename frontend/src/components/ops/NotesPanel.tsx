'use client';

import { useState, type FormEvent } from 'react';
import { Avatar, Banner, Button, Textarea } from '@/components/ui';
import { useAddNote } from '@/lib/api/hooks';
import type { Note } from '@/lib/api/types';
import { formatDateTime } from '@/lib/format';

const MAX_NOTE = 2000;

export function NotesPanel({ caseId, notes }: { caseId: number; notes: Note[] }) {
  const addNote = useAddNote(caseId);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string>();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) {
      setError('Write a note first');
      return;
    }
    setError(undefined);
    addNote.mutate(body.trim(), { onSuccess: () => setBody('') });
  };

  return (
    <section aria-labelledby="notes-title" className="flex flex-col gap-3">
      <h2 id="notes-title" className="text-h3">
        Internal notes
      </h2>
      {notes.length === 0 ? (
        <p className="text-small text-text-muted">No notes yet. Notes are visible to staff only.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="flex gap-2">
              <Avatar name={note.author} />
              <div>
                <p className="text-small">
                  <span className="font-semibold">{note.author}</span> <span className="text-text-muted">· {formatDateTime(note.createdAt)}</span>
                </p>
                <p className="whitespace-pre-wrap text-body">{note.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {addNote.isError && <Banner variant="danger">Could not add the note. Try again.</Banner>}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
        <Textarea label="Add note" value={body} onChange={(e) => setBody(e.target.value)} maxLength={MAX_NOTE} error={error} rows={3} />
        <Button type="submit" size="sm" loading={addNote.isPending} className="self-start">
          Add note
        </Button>
      </form>
    </section>
  );
}
