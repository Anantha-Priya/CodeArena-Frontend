import { useEffect, useState } from 'react';
import { ApiError } from '../../api/client';
import { getErrorMessage } from '../../api/errors';
import { createProblem, deleteProblem, listProblems, updateProblem } from '../../api/problems';
import { BackButton } from '../../components/BackButton';
import { DifficultyBadge } from '../../components/DifficultyBadge';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ListSkeleton } from '../../components/ListSkeleton';
import { ProblemForm, type ProblemFormState } from '../../components/ProblemForm';
import type { Problem, ProblemPayload } from '../../types/problem';

// Admin management is a flat list, not the browsing UI from Phase 4 — fetch everything
// in one page rather than replicating filters/pagination here.
const ADMIN_LIST_SIZE = 100;

type LoadState = 'loading' | 'loaded' | 'error';

function toFormState(problem: Problem): ProblemFormState {
  return {
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    topic: problem.topic,
    constraints: problem.constraints,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    sampleInput: problem.sampleInput,
    sampleOutput: problem.sampleOutput,
  };
}

export default function AdminProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [creating, setCreating] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function refresh() {
    setLoadState('loading');
    try {
      const result = await listProblems({ size: ADMIN_LIST_SIZE });
      setProblems(result.content);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(payload: ProblemPayload) {
    await createProblem(payload);
    setCreating(false);
    await refresh();
  }

  async function handleUpdate(payload: ProblemPayload) {
    if (!editingProblem) return;
    await updateProblem(editingProblem.id, payload);
    setEditingProblem(null);
    await refresh();
  }

  async function handleDelete(problem: Problem) {
    if (!window.confirm(`Delete "${problem.title}"? This can't be undone.`)) return;

    setActionError(null);
    try {
      await deleteProblem(problem.id);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setActionError('You are not authorized to perform this action.');
      } else {
        setActionError(getErrorMessage(err, 'Failed to delete the problem.'));
      }
    }
  }

  function startEdit(problem: Problem) {
    setCreating(false);
    setEditingProblem(problem);
  }

  return (
    <div>
      <BackButton fallback="/" label="Home" />

      <h1>Admin: Problems</h1>

      {actionError && <ErrorBanner message={actionError} />}

      {editingProblem ? (
        <>
          <h2>Edit Problem</h2>
          <ProblemForm
            initialValues={toFormState(editingProblem)}
            submitLabel="Save Changes"
            onSubmit={handleUpdate}
            onCancel={() => setEditingProblem(null)}
          />
        </>
      ) : creating ? (
        <>
          <h2>New Problem</h2>
          <ProblemForm submitLabel="Create Problem" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </>
      ) : (
        <button type="button" onClick={() => setCreating(true)}>
          New Problem
        </button>
      )}

      {loadState === 'loading' && <ListSkeleton />}
      {loadState === 'error' && <ErrorBanner message="Couldn't load problems." />}
      {loadState === 'loaded' && (
        <ul className="problem-list">
          {problems.map((problem) => (
            <li key={problem.id} className="problem-card admin-problem-row">
              <span className="problem-card__title">{problem.title}</span>
              <DifficultyBadge difficulty={problem.difficulty} />
              <span className="problem-card__topic">{problem.topic}</span>
              <div className="admin-problem-row__actions">
                <button type="button" className="button--secondary" onClick={() => startEdit(problem)}>
                  Edit
                </button>
                <button type="button" className="button--danger" onClick={() => handleDelete(problem)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
