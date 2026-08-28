import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { register as registerRequest } from '../api/auth';
import { ApiError } from '../api/client';
import { parseFieldErrors } from '../api/errors';
import { PasswordField } from '../components/PasswordField';
import { useAuth } from '../hooks/useAuth';

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  _general?: string;
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setSubmitting(true);

    try {
      await registerRequest({ username, email, password });
      navigate('/login', { state: { message: 'Account created — log in to continue.' } });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
        // 409 (duplicate username/email) and 400 (validation) both come back as one
        // message string — parseFieldErrors does its best to route it to a field.
        setFieldErrors(parseFieldErrors(err.message));
      } else {
        setFieldErrors({ _general: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Register</h1>
      {fieldErrors._general && <p className="banner banner--error">{fieldErrors._general}</p>}
      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
          />
          {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
        </label>
        <label className="field">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          required
          minLength={6}
          autoComplete="new-password"
          error={fieldErrors.password}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
