import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../api/axios";
import { employees } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, ErrorNote, Loading, Notice, PageHeader, Pill } from "../components/ui";
import { toInputDate } from "../utils";

const blank = {
  name: "", email: "", password: "", role: "employee", department: "", designation: "",
  phone: "", manager: "", joinDate: "", isActive: true,
};

export default function Employees() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items, page, pages, loading } = useSelector((s) => s.employees);
  const [search, setSearch] = useState("");
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback((p = 1) => dispatch(employees.fetchItems({ page: p, search: search || undefined })), [dispatch, search]);
  useEffect(() => {
    const t = setTimeout(() => load(1), 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => { api.get("/employees/managers").then((r) => setManagers(r.data.items)).catch(() => {}); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    const payload = { ...form };
    if (editId) { delete payload.email; delete payload.password; }
    if (!payload.joinDate) delete payload.joinDate;
    try {
      if (editId) await api.put(`/employees/${editId}`, payload);
      else await api.post("/employees", payload);
      setMsg(editId ? "Employee updated." : "Employee added.");
      setForm(blank); setEditId(null); setShow(false);
      load(editId ? page : 1);
      api.get("/employees/managers").then((r) => setManagers(r.data.items));
    } catch (x) { setErr(errMsg(x)); }
  };

  const edit = (emp) => {
    setForm({
      name: emp.name, email: emp.user?.email || "", password: "", role: emp.user?.role || "employee",
      department: emp.department || "", designation: emp.designation || "", phone: emp.phone || "",
      manager: emp.manager?._id || "", joinDate: toInputDate(emp.joinDate), isActive: emp.user?.isActive ?? true,
    });
    setEditId(emp._id); setShow(true); window.scrollTo(0, 0);
  };

  const toggleActive = async (emp) => {
    const active = emp.user?.isActive;
    if (!window.confirm(`${active ? "Deactivate" : "Reactivate"} ${emp.name}?`)) return;
    try {
      await api.put(`/employees/${emp._id}`, { isActive: !active });
      load(page);
    } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <>
      <PageHeader title="Employees" subtitle="Add people, set their role and assign managers.">
        <input className="form-control" placeholder="Search name, department…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employees" />
        <button className="btn btn-primary text-nowrap" onClick={() => { setShow(!show); setEditId(null); setForm(blank); }}>{show ? "Close" : "Add employee"}</button>
      </PageHeader>
      <Notice message={msg} />
      <ErrorNote message={err} />

      {show && (
        <form className="panel mb-4" onSubmit={submit}>
          <h5 className="panel-title">{editId ? "Edit employee" : "Add an employee"}</h5>
          <div className="row g-3">
            <div className="col-md-4"><label className="form-label">Full name</label>
              <input className="form-control" required value={form.name} onChange={set("name")} /></div>
            <div className="col-md-4"><label className="form-label">Email</label>
              <input className="form-control" type="email" required disabled={!!editId} value={form.email} onChange={set("email")} /></div>
            {!editId && (
              <div className="col-md-4"><label className="form-label">Temporary password</label>
                <input className="form-control" type="password" minLength={6} required value={form.password} onChange={set("password")} /></div>
            )}
            <div className="col-md-3"><label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={set("role")}>
                <option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option>
              </select></div>
            <div className="col-md-3"><label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={set("department")} /></div>
            <div className="col-md-3"><label className="form-label">Job title</label>
              <input className="form-control" value={form.designation} onChange={set("designation")} /></div>
            <div className="col-md-3"><label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={set("phone")} /></div>
            <div className="col-md-4"><label className="form-label">Reports to</label>
              <select className="form-select" value={form.manager} onChange={set("manager")}>
                <option value="">No manager</option>
                {managers.filter((m) => m._id !== editId).map((m) => <option key={m._id} value={m._id}>{m.name} ({m.designation})</option>)}
              </select></div>
            <div className="col-md-3"><label className="form-label">Join date</label>
              <input type="date" className="form-control" value={form.joinDate} onChange={set("joinDate")} /></div>
          </div>
          <button className="btn btn-primary mt-3">{editId ? "Save changes" : "Add employee"}</button>
        </form>
      )}

      <div className="panel">
        {loading ? <Loading /> : items.length === 0 ? <Empty>No employees match your search.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Manager</th><th>Status</th><th /></tr></thead>
              <tbody>
                {items.map((emp) => (
                  <tr key={emp._id} className={emp.user?.isActive ? "" : "text-muted"}>
                    <td><div className="fw-semibold">{emp.name}</div><small className="text-muted">{emp.user?.email} · {emp.designation}</small></td>
                    <td><Pill value={emp.user?.role} /></td>
                    <td>{emp.department}</td>
                    <td>{emp.manager?.name || "—"}</td>
                    <td>{emp.user?.isActive ? "Active" : "Deactivated"}</td>
                    <td className="text-nowrap">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => edit(emp)}>Edit</button>
                      {emp.user?._id !== user.id && (
                        <button className={`btn btn-sm ${emp.user?.isActive ? "btn-outline-danger" : "btn-outline-primary"}`} onClick={() => toggleActive(emp)}>
                          {emp.user?.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
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
