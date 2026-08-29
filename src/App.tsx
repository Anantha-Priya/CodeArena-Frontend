import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './components/AdminRoute';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthProvider';
import AdminContests from './pages/Admin/AdminContests';
import AdminProblems from './pages/Admin/AdminProblems';
import ContestDetail from './pages/ContestDetail';
import Contests from './pages/Contests';
import Home from './pages/Home';
import Login from './pages/Login';
import ProblemDetail from './pages/ProblemDetail';
import Profile from './pages/Profile';
import Problems from './pages/Problems';
import Register from './pages/Register';
import Submissions from './pages/Submissions';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/problems" element={<Problems />} />
              <Route path="/problems/:id" element={<ProblemDetail />} />
              <Route path="/contests" element={<Contests />} />
              <Route path="/contests/:id" element={<ContestDetail />} />
              <Route path="/submissions/my" element={<Submissions />} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin/problems" element={<AdminProblems />} />
                <Route path="/admin/contests" element={<AdminContests />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
