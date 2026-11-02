import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearError, login } from "../features/authSlice";
import { ErrorNote } from "../components/ui";

export default function Login() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  if (user) return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;

  const submit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <Link to="/" className="brand p-0 text-decoration-none">Staff<span>Sync</span></Link>
        <div>
          <h1>Welcome back.</h1>
          <p className="mt-3">Sign in to check in, manage leave and see what is new at work.</p>
        </div>
        <small className="text-secondary">HR · Managers · Employees</small>
      </div>
      <div className="auth-form">
        <form className="auth-card" onSubmit={submit}>
          <h3 className="mb-4">Sign in</h3>
          <ErrorNote message={error} />
          <label className="form-label">Email</label>
          <input className="form-control mb-3" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="username" />
          <label className="form-label">Password</label>
          <input className="form-control mb-4" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          <button className="btn btn-primary w-100" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          <p className="mt-3 mb-3">New here? <Link to="/register">Create an account</Link></p>
          <div className="demo">
            After running <code>npm run seed</code>: hr@staffsync.com, manager@staffsync.com or employee@staffsync.com, password <code>Password@123</code>
          </div>
        </form>
      </div>
    </div>
  );
}
