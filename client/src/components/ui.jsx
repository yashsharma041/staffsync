export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
      <div>
        <h2 className="mb-1">{title}</h2>
        {subtitle && <div className="text-muted">{subtitle}</div>}
      </div>
      <div className="d-flex gap-2">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, hint, accent }) {
  return (
    <div className={`stat ${accent ? "accent" : ""}`}>
      <div className="label">{label}</div>
      <div className="value">{value ?? "—"}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export const Pill = ({ value }) => <span className={`pill ${value}`}>{value}</span>;

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export const Loading = () => (
  <div className="empty">
    <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
    Loading…
  </div>
);

export const ErrorNote = ({ message }) =>
  message ? <div className="alert alert-danger py-2 mb-3">{message}</div> : null;

export const Notice = ({ message }) =>
  message ? <div className="alert alert-success py-2 mb-3">{message}</div> : null;
