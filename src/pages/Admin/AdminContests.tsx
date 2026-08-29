import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { createContest, listContests } from '../../api/contests';
import { getErrorMessage } from '../../api/errors';
import { ContestProblemsPanel } from '../../components/ContestProblemsPanel';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ListSkeleton } from '../../components/ListSkeleton';
import type { Contest, ContestPayload } from '../../types/contest';

type LoadState = 'loading' | 'loaded' | 'error';

interface ContestFormState {
  title: string;
  description: string;
  startTime: string; // raw datetime-local value: "YYYY-MM-DDTHH:mm"
  endTime: string;
}

const EMPTY_FORM: ContestFormState = { title: '', description: '', startTime: '', endTime: '' };

interface FieldErrors {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  _general?: string;
}

// datetime-local gives "YYYY-MM-DDTHH:mm" (no seconds) — append them so the payload
// matches exactly what the backend documents. Still plain local wall-clock text, no
// timezone conversion anywhere — the backend interprets it as its own local time.
function toBackendDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

function validate(form: ContestFormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (!form.startTime) errors.startTime = 'Start time is required';
  if (!form.endTime) errors.endTime = 'End time is required';
  // Mirrors the backend's @EndTimeAfterStartTime (strictly after — equal times fail too).
  if (form.startTime && form.endTime && form.endTime <= form.startTime) {
    errors.endTime = 'End time must be after start time';
  }
  return errors;
}

export default function AdminContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ContestFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [managingId, setManagingId] = useState<number | null>(null);

  async function refresh() {
    setLoadState('loading');
    try {
      const result = await listContests();
      setContests(result);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateForm<K extends keyof ContestFormState>(key: K, value: ContestFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function cancelCreate() {
    setCreating(false);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const payload: ContestPayload = {
        title: form.title,
        description: form.description,
        startTime: toBackendDateTime(form.startTime),
        endTime: toBackendDateTime(form.endTime),
      };
      await createContest(payload);
      setForm(EMPTY_FORM);
      setCreating(false);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setFieldErrors({ _general: 'You are not authorized to perform this action.' });
      } else if (err instanceof ApiError && err.status === 400) {
        // Backend's own end-time-after-start-time check, as a fallback — the client-side
        // check above should already catch this before a request ever goes out.
        setFieldErrors({ _general: err.message });
      } else {
        setFieldErrors({ _general: getErrorMessage(err) });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Admin: Contests</h1>

      {creating ? (
        <>
          <h2>New Contest</h2>
          <form onSubmit={handleCreate} className="form contest-form">
            {fieldErrors._general && <ErrorBanner message={fieldErrors._general} />}

            <label className="field">
              Title
              <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
              {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
            </label>

            <label className="field">
              Description
              <textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                rows={3}
              />
              {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
            </label>

            <label className="field">
              Start Time
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(event) => updateForm('startTime', event.target.value)}
              />
              {fieldErrors.startTime && <span className="field-error">{fieldErrors.startTime}</span>}
            </label>

            <label className="field">
              End Time
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(event) => updateForm('endTime', event.target.value)}
              />
              {fieldErrors.endTime && <span className="field-error">{fieldErrors.endTime}</span>}
            </label>

            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Contest'}
              </button>
              <button type="button" className="button--secondary" onClick={cancelCreate}>
                Cancel
              </button>
            </div>
          </form>
        </>
      ) : (
        <button type="button" onClick={() => setCreating(true)}>
          New Contest
        </button>
      )}

      <h2 className="admin-contests__list-heading">Existing Contests</h2>

      {loadState === 'loading' && <ListSkeleton />}
      {loadState === 'error' && <ErrorBanner message="Couldn't load contests." />}
      {loadState === 'loaded' &&
        (contests.length === 0 ? (
          <p className="empty-state">No contests yet.</p>
        ) : (
          <ul className="contest-list">
            {contests.map((contest) => (
              <li key={contest.id} className="contest-card admin-contest-row">
                <div className="admin-contest-row__header">
                  <span className="contest-card__title">{contest.title}</span>
                  <button
                    type="button"
                    className="button--secondary"
                    onClick={() => setManagingId(managingId === contest.id ? null : contest.id)}
                  >
                    {managingId === contest.id ? 'Hide Problems' : 'Manage Problems'}
                  </button>
                </div>
                {managingId === contest.id && <ContestProblemsPanel contestId={contest.id} />}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
