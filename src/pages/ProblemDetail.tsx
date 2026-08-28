import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProblem } from '../api/problems';
import { ApiError } from '../api/client';
import { DifficultyBadge } from '../components/DifficultyBadge';
import type { Problem } from '../types/problem';

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error';

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [state, setState] = useState<LoadState>('loading');

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
    return <p className="banner banner--error">Couldn&apos;t load this problem. Please try again.</p>;
  }

  if (state === 'loading' || !problem) {
    return <p>Loading problem…</p>;
  }

  return (
    <div className="problem-detail">
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
    </div>
  );
}
