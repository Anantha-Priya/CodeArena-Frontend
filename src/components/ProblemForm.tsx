import { useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { parseFieldErrors } from '../api/errors';
import type { Difficulty, ProblemPayload } from '../types/problem';

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export interface ProblemFormState {
  title: string;
  description: string;
  difficulty: Difficulty | '';
  topic: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
}

const EMPTY_PROBLEM_FORM: ProblemFormState = {
  title: '',
  description: '',
  difficulty: '',
  topic: '',
  constraints: '',
  inputFormat: '',
  outputFormat: '',
  sampleInput: '',
  sampleOutput: '',
};

interface FieldErrors {
  title?: string;
  description?: string;
  difficulty?: string;
  topic?: string;
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  sampleInput?: string;
  sampleOutput?: string;
  _general?: string;
}

function validate(form: ProblemFormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  if (!form.description.trim()) errors.description = 'Description is required';
  if (!form.difficulty) errors.difficulty = 'Difficulty is required';
  if (!form.topic.trim()) errors.topic = 'Topic is required';
  if (!form.constraints.trim()) errors.constraints = 'Constraints are required';
  if (!form.inputFormat.trim()) errors.inputFormat = 'Input format is required';
  if (!form.outputFormat.trim()) errors.outputFormat = 'Output format is required';
  if (!form.sampleInput.trim()) errors.sampleInput = 'Sample input is required';
  if (!form.sampleOutput.trim()) errors.sampleOutput = 'Sample output is required';
  return errors;
}

interface ProblemFormProps {
  initialValues?: ProblemFormState;
  submitLabel: string;
  onSubmit: (payload: ProblemPayload) => Promise<void>;
  onCancel: () => void;
}

export function ProblemForm({ initialValues, submitLabel, onSubmit, onCancel }: ProblemFormProps) {
  const [form, setForm] = useState<ProblemFormState>(initialValues ?? EMPTY_PROBLEM_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ProblemFormState>(key: K, value: ProblemFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit({ ...form, difficulty: form.difficulty as Difficulty });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setFieldErrors({ _general: 'You are not authorized to perform this action.' });
      } else if (err instanceof ApiError && err.status === 400) {
        setFieldErrors(parseFieldErrors(err.message));
      } else {
        setFieldErrors({ _general: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form problem-form">
      {fieldErrors._general && <p className="banner banner--error">{fieldErrors._general}</p>}

      <label className="field">
        Title
        <input value={form.title} onChange={(event) => update('title', event.target.value)} />
        {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
      </label>

      <label className="field">
        Difficulty
        <select
          value={form.difficulty}
          onChange={(event) => update('difficulty', event.target.value as Difficulty | '')}
        >
          <option value="">Select difficulty</option>
          {DIFFICULTIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {fieldErrors.difficulty && <span className="field-error">{fieldErrors.difficulty}</span>}
      </label>

      <label className="field">
        Topic
        <input value={form.topic} onChange={(event) => update('topic', event.target.value)} />
        {fieldErrors.topic && <span className="field-error">{fieldErrors.topic}</span>}
      </label>

      <label className="field">
        Description
        <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} />
        {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
      </label>

      <label className="field">
        Constraints
        <textarea value={form.constraints} onChange={(event) => update('constraints', event.target.value)} rows={3} />
        {fieldErrors.constraints && <span className="field-error">{fieldErrors.constraints}</span>}
      </label>

      <label className="field">
        Input Format
        <textarea value={form.inputFormat} onChange={(event) => update('inputFormat', event.target.value)} rows={3} />
        {fieldErrors.inputFormat && <span className="field-error">{fieldErrors.inputFormat}</span>}
      </label>

      <label className="field">
        Output Format
        <textarea value={form.outputFormat} onChange={(event) => update('outputFormat', event.target.value)} rows={3} />
        {fieldErrors.outputFormat && <span className="field-error">{fieldErrors.outputFormat}</span>}
      </label>

      <label className="field">
        Sample Input
        <textarea
          value={form.sampleInput}
          onChange={(event) => update('sampleInput', event.target.value)}
          rows={3}
          className="mono-textarea"
        />
        {fieldErrors.sampleInput && <span className="field-error">{fieldErrors.sampleInput}</span>}
      </label>

      <label className="field">
        Sample Output
        <textarea
          value={form.sampleOutput}
          onChange={(event) => update('sampleOutput', event.target.value)}
          rows={3}
          className="mono-textarea"
        />
        {fieldErrors.sampleOutput && <span className="field-error">{fieldErrors.sampleOutput}</span>}
      </label>

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="button--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
