import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProblems } from '../api/problems';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { ListSkeleton } from '../components/ListSkeleton';
import type { Page } from '../types/api';
import type { Difficulty, Problem } from '../types/problem';

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const PAGE_SIZE = 10;
const TOPIC_DEBOUNCE_MS = 400;

type LoadState = 'loading' | 'loaded' | 'error';

export default function Problems() {
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [topicInput, setTopicInput] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<Problem> | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  // Debounce the topic text input so it doesn't fire a request per keystroke.
  // Resets the page here too (rather than in a separate effect keyed on
  // [difficulty, topic]) since this is the actual event that changes the filter.
  useEffect(() => {
    const handle = setTimeout(() => {
      setTopic(topicInput.trim());
      setPage(0);
    }, TOPIC_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [topicInput]);

  useEffect(() => {
    let cancelled = false;
    setState('loading');

    listProblems({ difficulty: difficulty || undefined, topic: topic || undefined, page, size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setState('loaded');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [difficulty, topic, page]);

  return (
    <div>
      <h1>Problems</h1>

      <div className="filters">
        <select
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value as Difficulty | '');
            setPage(0);
          }}
          aria-label="Filter by difficulty"
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by topic"
          value={topicInput}
          onChange={(event) => setTopicInput(event.target.value)}
          aria-label="Filter by topic"
        />
      </div>

      {state === 'loading' && <ListSkeleton rows={PAGE_SIZE} />}

      {state === 'error' && <p className="banner banner--error">Couldn&apos;t load problems. Please try again.</p>}

      {state === 'loaded' && data && (
        <>
          {data.empty ? (
            <p className="empty-state">No problems match your filters.</p>
          ) : (
            <ul className="problem-list">
              {data.content.map((problem) => (
                <li key={problem.id} className="problem-card">
                  <Link to={`/problems/${problem.id}`} className="problem-card__link">
                    <span className="problem-card__title">{problem.title}</span>
                    <DifficultyBadge difficulty={problem.difficulty} />
                    <span className="problem-card__topic">{problem.topic}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!data.empty && (
            <div className="pagination">
              <button type="button" disabled={data.first} onClick={() => setPage((current) => current - 1)}>
                Previous
              </button>
              <span>
                Page {data.number + 1} of {data.totalPages}
              </span>
              <button type="button" disabled={data.last} onClick={() => setPage((current) => current + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
