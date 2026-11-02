import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../api/axios";
import { loadMe } from "../features/authSlice";
import { ErrorNote, Notice, PageHeader, Pill } from "../components/ui";
import { fmtDate } from "../utils";

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const emp = user.employee || {};
  const [form, setForm] = useState({
    name: emp.name || "", phone: emp.phone || "", address: emp.address || "", emergencyContact: emp.emergencyContact || "",
  });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const flash = (m, e = "") => { setMsg(m); setErr(e); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.put("/employees/me", form);
      await dispatch(loadMe());
      flash("Profile saved.");
    } catch (x) { flash("", errMsg(x)); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/password", pw);
      setPw({ currentPassword: "", newPassword: "" });
      flash("Password changed.");
    } catch (x) { flash("", errMsg(x)); }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle={user.email}>
        <Pill value={user.role} />
      </PageHeader>
      <Notice message={msg} />
      <ErrorNote message={err} />
      <div className="row g-3">
        <div className="col-lg-7">
          <form className="panel" onSubmit={save}>
            <h5 className="panel-title">Personal information</h5>
            <div className="row g-3">
              <div className="col-md-6"><label className="form-label">Full name</label>
                <input className="form-control" required value={form.name} onChange={set("name")} /></div>
              <div className="col-md-6"><label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={set("phone")} /></div>
              <div className="col-12"><label className="form-label">Address</label>
                <input className="form-control" value={form.address} onChange={set("address")} /></div>
              <div className="col-12"><label className="form-label">Emergency contact</label>
                <input className="form-control" value={form.emergencyContact} onChange={set("emergencyContact")} /></div>
            </div>
            <button className="btn btn-primary mt-3">Save changes</button>
          </form>
        </div>
        <div className="col-lg-5">
          <div className="panel mb-3">
            <h5 className="panel-title">Work details</h5>
            <dl className="row mb-0">
              <dt className="col-5 text-muted fw-normal">Department</dt><dd className="col-7">{emp.department}</dd>
              <dt className="col-5 text-muted fw-normal">Job title</dt><dd className="col-7">{emp.designation}</dd>
              <dt className="col-5 text-muted fw-normal">Manager</dt><dd className="col-7">{emp.manager?.name || "—"}</dd>
              <dt className="col-5 text-muted fw-normal">Joined</dt><dd className="col-7">{fmtDate(emp.joinDate)}</dd>
            </dl>
            <small className="text-muted">Department, title and manager are managed by HR.</small>
          </div>
          <form className="panel" onSubmit={changePw}>
            <h5 className="panel-title">Change password</h5>
            <input className="form-control mb-2" type="password" placeholder="Current password" required
              value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <input className="form-control mb-3" type="password" placeholder="New password (6+ characters)" minLength={6} required
              value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            <button className="btn btn-outline-primary">Update password</button>
          </form>
        </div>
      </div>
    </>
  );
}
