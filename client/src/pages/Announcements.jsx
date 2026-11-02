import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../api/axios";
import { announcements } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, ErrorNote, Loading, Notice, PageHeader } from "../components/ui";
import { fmtDate } from "../utils";

const blank = { title: "", body: "", audience: "all" };

export default function Announcements() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items, page, pages, loading } = useSelector((s) => s.announcements);
  const isHR = user.role === "hr";
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback((p = 1) => dispatch(announcements.fetchItems({ page: p })), [dispatch]);
  useEffect(() => { load(1); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      if (editId) await api.put(`/announcements/${editId}`, form);
      else await api.post("/announcements", form);
      setMsg(editId ? "Announcement updated." : "Announcement posted.");
      setForm(blank); setEditId(null); setShow(false);
      load(1);
    } catch (x) { setErr(errMsg(x)); }
  };

  const edit = (a) => { setForm({ title: a.title, body: a.body, audience: a.audience }); setEditId(a._id); setShow(true); window.scrollTo(0, 0); };
  const remove = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try { await api.delete(`/announcements/${id}`); load(page); } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <>
      <PageHeader title="Announcements" subtitle="News and updates from HR.">
        {isHR && <button className="btn btn-primary" onClick={() => { setShow(!show); setEditId(null); setForm(blank); }}>{show ? "Close" : "New announcement"}</button>}
      </PageHeader>
      <Notice message={msg} />
      <ErrorNote message={err} />

      {isHR && show && (
        <form className="panel mb-4" onSubmit={submit}>
          <h5 className="panel-title">{editId ? "Edit announcement" : "Post an announcement"}</h5>
          <div className="row g-3">
            <div className="col-md-8"><label className="form-label">Title</label>
              <input className="form-control" required value={form.title} onChange={set("title")} /></div>
            <div className="col-md-4"><label className="form-label">Who should see it</label>
              <select className="form-select" value={form.audience} onChange={set("audience")}>
                <option value="all">Everyone</option><option value="employee">Employees</option><option value="manager">Managers</option>
              </select></div>
            <div className="col-12"><label className="form-label">Message</label>
              <textarea className="form-control" rows={4} required value={form.body} onChange={set("body")} /></div>
          </div>
          <button className="btn btn-primary mt-3">{editId ? "Save changes" : "Post"}</button>
        </form>
      )}

      {loading ? <Loading /> : items.length === 0 ? <div className="panel"><Empty>No announcements yet.</Empty></div> : (
        items.map((a) => (
          <article className="panel mb-3" key={a._id}>
            <div className="d-flex justify-content-between gap-3">
              <div>
                <h5 className="mb-1">{a.title}</h5>
                <div className="text-muted small mb-2">{fmtDate(a.createdAt)} · {a.postedBy?.name}{isHR && ` · for ${a.audience === "all" ? "everyone" : a.audience + "s"}`}</div>
              </div>
              {isHR && (
                <div className="text-nowrap">
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => edit(a)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => remove(a._id)}>Delete</button>
                </div>
              )}
            </div>
            <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{a.body}</p>
          </article>
        ))
      )}
      <Pagination page={page} pages={pages} onChange={load} />
    </>
  );
}
