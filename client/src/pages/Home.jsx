import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const FEATURES = [
  ["Attendance", "Check in and out in one click. Late arrivals and half days are marked automatically."],
  ["Leave", "Apply, track and approve leave. Balances update the moment a manager approves."],
  ["Team and training", "Managers see their team's attendance and enrol people in training programmes."],
  ["Announcements", "HR posts news once, and the right people are notified."],
];

export default function Home() {
  const { user } = useSelector((s) => s.auth);
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="fs-4 fw-bold mb-4">Staff<span style={{ color: "#e5b04a" }}>Sync</span></div>
          <h1>Run your people operations from one place.</h1>
          <p className="mt-3">
            Attendance, leave, announcements and training for HR, managers and employees, with the right access for each.
          </p>
          <div className="d-flex gap-2 mt-4">
            <Link to="/login" className="btn btn-light btn-lg">Sign in</Link>
            <Link to="/register" className="btn btn-outline-light btn-lg">Create an account</Link>
          </div>
        </div>
      </section>
      <section className="container py-5">
        <div className="row g-4">
          {FEATURES.map(([t, d]) => (
            <div className="col-md-6 col-lg-3" key={t}>
              <h5>{t}</h5>
              <p className="text-muted mb-0">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
