import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../api/axios";
import { trainings } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, ErrorNote, Loading, Notice, PageHeader, Pill } from "../components/ui";
import { fmtDate, toInputDate } from "../utils";

const blank = { title: "", description: "", startDate: "", endDate: "", status: "scheduled", assignedTo: [] };

export default function ManageTrainings() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items, page, pages, loading } = useSelector((s) => s.trainings);
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback((p = 1) => dispatch(trainings.fetchItems({ url: "/trainings", page: p })), [dispatch]);
  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    const url = user.role === "hr" ? "/employees" : "/manager/team";
    api.get(url, { params: { limit: 100 } }).then((r) => setPeople(r.data.items)).catch(() => {});
  }, [user.role]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (id) =>
    setForm({ ...form, assignedTo: form.assignedTo.includes(id) ? form.assignedTo.filter((x) => x !== id) : [...form.assignedTo, id] });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      if (editId) await api.put(`/trainings/${editId}`, form);
      else await api.post("/trainings", form);
      setMsg(editId ? "Programme updated." : "Programme created and participants notified.");
      setForm(blank); setEditId(null); setShow(false);
      load(1);
    } catch (x) { setErr(errMsg(x)); }
  };

  const edit = (t) => {
    setForm({
      title: t.title, description: t.description || "", startDate: toInputDate(t.startDate), endDate: toInputDate(t.endDate),
      status: t.status, assignedTo: t.assignedTo.map((a) => a._id),
    });
    setEditId(t._id); setShow(true); window.scrollTo(0, 0);
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this programme?")) return;
    try { await api.delete(`/trainings/${id}`); load(page); } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <>
      <PageHeader title="Training programmes" subtitle={user.role === "hr" ? "All programmes in the company." : "Programmes you run for your team."}>
        <button className="btn btn-primary" onClick={() => { setShow(!show); setEditId(null); setForm(blank); }}>{show ? "Close" : "New programme"}</button>
      </PageHeader>
      <Notice message={msg} />
      <ErrorNote message={err} />

      {show && (
        <form className="panel mb-4" onSubmit={submit}>
          <h5 className="panel-title">{editId ? "Edit programme" : "Create a programme"}</h5>
          <div className="row g-3">
            <div className="col-md-6"><label className="form-label">Title</label>
              <input className="form-control" required value={form.title} onChange={set("title")} /></div>
            <div className="col-md-2"><label className="form-label">Starts</label>
              <input type="date" className="form-control" required value={form.startDate} onChange={set("startDate")} /></div>
            <div className="col-md-2"><label className="form-label">Ends</label>
              <input type="date" className="form-control" required min={form.startDate} value={form.endDate} onChange={set("endDate")} /></div>
            <div className="col-md-2"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={set("status")}>
                {["scheduled", "ongoing", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}
              </select></div>
            <div className="col-12"><label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={set("description")} /></div>
            <div className="col-12">
              <label className="form-label">Participants ({form.assignedTo.length} selected)</label>
              <div className="border rounded p-2" style={{ maxHeight: 180, overflowY: "auto" }}>
                {people.length === 0 && <div className="text-muted small">No people available to assign.</div>}
                {people.map((p) => (
                  <div className="form-check" key={p._id}>
                    <input className="form-check-input" type="checkbox" id={`p-${p._id}`} checked={form.assignedTo.includes(p._id)} onChange={() => toggle(p._id)} />
                    <label className="form-check-label" htmlFor={`p-${p._id}`}>{p.name} <small className="text-muted">{p.department}</small></label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary mt-3">{editId ? "Save changes" : "Create programme"}</button>
        </form>
      )}

      <div className="panel">
        {loading ? <Loading /> : items.length === 0 ? <Empty>No programmes yet. Create the first one.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Programme</th><th>Dates</th><th>Participants</th><th>Status</th><th /></tr></thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t._id}>
                    <td><div className="fw-semibold">{t.title}</div><small className="text-muted">by {t.createdBy?.name}</small></td>
                    <td>{fmtDate(t.startDate)} – {fmtDate(t.endDate)}</td>
                    <td className="small">{t.assignedTo.map((a) => a.name).join(", ") || "—"}</td>
                    <td><Pill value={t.status} /></td>
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => edit(t)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(t._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} onChange={load} />
      </div>
    </>
  );
}
