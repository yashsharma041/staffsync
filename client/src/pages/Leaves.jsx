import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../api/axios";
import { loadMe } from "../features/authSlice";
import { leaves } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, ErrorNote, Loading, Notice, PageHeader, Pill, StatCard } from "../components/ui";
import { fmtDate, today } from "../utils";

const blank = { type: "casual", fromDate: "", toDate: "", reason: "" };

export default function Leaves() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items, page, pages, loading } = useSelector((s) => s.leaves);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const bal = user.employee?.leaveBalance || {};

  const load = useCallback((p = 1) => dispatch(leaves.fetchItems({ url: "/leaves/me", page: p })), [dispatch]);
  useEffect(() => { load(1); dispatch(loadMe()); }, [load, dispatch]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await api.post("/leaves", form);
      setForm(blank);
      setMsg("Leave request sent.");
      load(1);
    } catch (x) { setErr(errMsg(x)); }
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try { await api.delete(`/leaves/${id}`); load(page); } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <>
      <PageHeader title="My leaves" subtitle="Apply for leave and follow its status." />
      <div className="row g-3 mb-4">
        {["casual", "sick", "earned"].map((k) => (
          <div className="col-4" key={k}><StatCard label={`${k[0].toUpperCase() + k.slice(1)} leave`} value={bal[k]} hint="days left" /></div>
        ))}
      </div>
      <Notice message={msg} />
      <ErrorNote message={err} />
      <div className="row g-3">
        <div className="col-lg-4">
          <form className="panel" onSubmit={submit}>
            <h5 className="panel-title">New request</h5>
            <label className="form-label">Type</label>
            <select className="form-select mb-3" value={form.type} onChange={set("type")}>
              <option value="casual">Casual</option><option value="sick">Sick</option>
              <option value="earned">Earned</option><option value="unpaid">Unpaid</option>
            </select>
            <div className="row g-2 mb-3">
              <div className="col"><label className="form-label">From</label>
                <input type="date" className="form-control" required min={today()} value={form.fromDate} onChange={set("fromDate")} /></div>
              <div className="col"><label className="form-label">To</label>
                <input type="date" className="form-control" required min={form.fromDate || today()} value={form.toDate} onChange={set("toDate")} /></div>
            </div>
            <label className="form-label">Reason</label>
            <textarea className="form-control mb-3" rows={3} required value={form.reason} onChange={set("reason")} />
            <button className="btn btn-primary w-100">Send request</button>
          </form>
        </div>
        <div className="col-lg-8">
          <div className="panel">
            <h5 className="panel-title">Request history</h5>
            {loading ? <Loading /> : items.length === 0 ? <Empty>No requests yet. Use the form to apply for leave.</Empty> : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reviewer note</th><th /></tr></thead>
                  <tbody>
                    {items.map((l) => (
                      <tr key={l._id}>
                        <td className="text-capitalize">{l.type}</td>
                        <td>{fmtDate(l.fromDate)} – {fmtDate(l.toDate)}</td>
                        <td>{l.days}</td>
                        <td><Pill value={l.status} /></td>
                        <td className="small">{l.remarks || (l.reviewedBy ? `by ${l.reviewedBy.name}` : "—")}</td>
                        <td>{l.status === "pending" && <button className="btn btn-sm btn-outline-danger" onClick={() => cancel(l._id)}>Cancel</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pages={pages} onChange={load} />
          </div>
        </div>
      </div>
    </>
  );
}
