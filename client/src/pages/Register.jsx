import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearError, register } from "../features/authSlice";
import { ErrorNote } from "../components/ui";

export default function Register() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", designation: "", phone: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
    dispatch(register(data));
  };

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <Link to="/" className="brand p-0 text-decoration-none">Staff<span>Sync</span></Link>
        <div>
          <h1>Create your account.</h1>
          <p className="mt-3">New accounts start as employees. HR can change your role and assign your manager.</p>
        </div>
        <small className="text-secondary">It takes under a minute.</small>
      </div>
      <div className="auth-form">
        <form className="auth-card" onSubmit={submit}>
          <h3 className="mb-4">Register</h3>
          <ErrorNote message={error} />
          <label className="form-label">Full name</label>
          <input className="form-control mb-3" required value={form.name} onChange={set("name")} />
          <label className="form-label">Email</label>
          <input className="form-control mb-3" type="email" required value={form.email} onChange={set("email")} />
          <label className="form-label">Password</label>
          <input className="form-control mb-3" type="password" minLength={6} required value={form.password} onChange={set("password")} />
          <div className="row g-2 mb-4">
            <div className="col"><label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={set("department")} /></div>
            <div className="col"><label className="form-label">Job title</label>
              <input className="form-control" value={form.designation} onChange={set("designation")} /></div>
          </div>
          <button className="btn btn-primary w-100" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
          <p className="mt-3 mb-0">Already registered? <Link to="/login">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
