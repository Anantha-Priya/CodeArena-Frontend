import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getContest } from '../api/contests';
import { getErrorMessage } from '../api/errors';
import { getProblem } from '../api/problems';
import { createSubmission } from '../api/submissions';
import { BackButton } from '../components/BackButton';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ErrorBanner } from '../components/ErrorBanner';
import { ListSkeleton } from '../components/ListSkeleton';
import type { Problem } from '../types/problem';
import type { Submission, SubmissionStatus } from '../types/submission';

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error';

const SUBMISSION_STATUSES: SubmissionStatus[] = ['ACCEPTED', 'WRONG_ANSWER', 'COMPILATION_ERROR'];

interface SubmissionFormState {
  language: string;
  sourceCode: string;
  status: SubmissionStatus | '';
}

const EMPTY_SUBMISSION_FORM: SubmissionFormState = { language: '', sourceCode: '', status: '' };

interface SubmissionFieldErrors {
  language?: string;
  sourceCode?: string;
  status?: string;
  _general?: string;
}

function validateSubmission(form: SubmissionFormState): SubmissionFieldErrors {
  const errors: SubmissionFieldErrors = {};
  if (!form.language.trim()) errors.language = 'Language is required';
  if (!form.sourceCode.trim()) errors.sourceCode = 'Source code is required';
  if (!form.status) errors.status = 'Status is required';
  return errors;
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get('contestId');

  const [problem, setProblem] = useState<Problem | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [contestTitle, setContestTitle] = useState<string | null>(null);

  const [submissionForm, setSubmissionForm] = useState<SubmissionFormState>(EMPTY_SUBMISSION_FORM);
  const [submissionErrors, setSubmissionErrors] = useState<SubmissionFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<Submission | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setState('loading');

    getProblem(id)
      .then((result) => {
        if (cancelled) return;
        setProblem(result);
        setState('loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        // A malformed (non-numeric) id gets a plain 400 from Spring's default handler
        // rather than the app's {status, message} 404 — either way it doesn't resolve
        // to a real problem, so both read as "not found" here.
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
          setState('not-found');
        } else {
          setState('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!contestId) return;

    let cancelled = false;

    getContest(contestId)
      .then((result) => {
        if (!cancelled) setContestTitle(result.title);
      })
      .catch(() => {
        // Non-fatal — the "for contest #<id>" fallback below still lets submission work.
      });

    return () => {
      cancelled = true;
    };
  }, [contestId]);

  function updateSubmissionForm<K extends keyof SubmissionFormState>(key: K, value: SubmissionFormState[K]) {
    setSubmissionForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmitSolution(event: FormEvent) {
    event.preventDefault();
    if (!contestId || !problem) return;

    const validationErrors = validateSubmission(submissionForm);
    if (Object.keys(validationErrors).length > 0) {
      setSubmissionErrors(validationErrors);
      return;
    }

    setSubmissionErrors({});
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await createSubmission({
        contestId: Number(contestId),
        problemId: problem.id,
        language: submissionForm.language,
        sourceCode: submissionForm.sourceCode,
        status: submissionForm.status as SubmissionStatus,
      });
      setSubmitResult(result);
      setSubmissionForm(EMPTY_SUBMISSION_FORM);
    } catch (err) {
      // Every rejection (not joined / contest not active / problem not in contest / not
      // found) is a distinct, already-clear message straight from the backend — show it
      // verbatim rather than re-wording it into a generic error.
      setSubmissionErrors({ _general: getErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'not-found') {
    return (
      <div>
        <h1>Problem not found</h1>
        <p>We couldn&apos;t find a problem with that id.</p>
        <Link to="/problems">Back to Problems</Link>
      </div>
    );
  }

  if (state === 'error') {
    return <ErrorBanner message="Couldn't load this problem. Please try again." />;
  }

  if (state === 'loading' || !problem) {
    return <ListSkeleton rows={6} />;
  }

  return (
    <div className="problem-detail">
      <BackButton fallback={contestId ? `/contests/${contestId}` : '/problems'} label={contestId ? 'Contest' : 'Problems'} />

      <div className="problem-detail__header">
        <h1>{problem.title}</h1>
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="problem-detail__topic">{problem.topic}</span>
      </div>

      <section>
        <h2>Description</h2>
        <p className="problem-detail__prose">{problem.description}</p>
      </section>

      <section>
        <h2>Constraints</h2>
        <pre className="problem-detail__code">{problem.constraints}</pre>
      </section>

      <section>
        <h2>Input Format</h2>
        <pre className="problem-detail__code">{problem.inputFormat}</pre>
      </section>

      <section>
        <h2>Output Format</h2>
        <pre className="problem-detail__code">{problem.outputFormat}</pre>
      </section>

      <section>
        <h2>Sample Input</h2>
        <pre className="problem-detail__code">{problem.sampleInput}</pre>
      </section>

      <section>
        <h2>Sample Output</h2>
        <pre className="problem-detail__code">{problem.sampleOutput}</pre>
      </section>

      {contestId && (
        <section className="submission-section">
          <h2>Submit Solution</h2>
          <p className="submission-section__context">
            For contest: {contestTitle ?? `#${contestId}`} <Link to={`/contests/${contestId}`}>View contest</Link>
          </p>
          <p className="submission-section__disclaimer">
            This project has no real code execution engine — pick the outcome yourself below;
            it isn&apos;t judged automatically.
          </p>

          {submitResult && (
            <p className="banner banner--success">
              Submitted — status {submitResult.status}, score {submitResult.score}.{' '}
              <Link to="/submissions/my">View My Submissions</Link>
            </p>
          )}

          {submissionErrors._general && <ErrorBanner message={submissionErrors._general} />}

          <form onSubmit={handleSubmitSolution} className="form submission-form">
            <label className="field">
              Language
              <input
                value={submissionForm.language}
                onChange={(event) => updateSubmissionForm('language', event.target.value)}
                placeholder="e.g. java"
              />
              {submissionErrors.language && <span className="field-error">{submissionErrors.language}</span>}
            </label>

            <label className="field">
              Source Code
              <textarea
                value={submissionForm.sourceCode}
                onChange={(event) => updateSubmissionForm('sourceCode', event.target.value)}
                rows={8}
                className="mono-textarea"
              />
              {submissionErrors.sourceCode && <span className="field-error">{submissionErrors.sourceCode}</span>}
            </label>

            <label className="field">
              Status
              <select
                value={submissionForm.status}
                onChange={(event) => updateSubmissionForm('status', event.target.value as SubmissionStatus | '')}
              >
                <option value="">Select status</option>
                {SUBMISSION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {submissionErrors.status && <span className="field-error">{submissionErrors.status}</span>}
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Solution'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
