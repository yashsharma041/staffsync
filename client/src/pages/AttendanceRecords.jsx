import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { attendance } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, Loading, PageHeader, Pill } from "../components/ui";
import { fmtDate, fmtTime } from "../utils";

// Shared by managers (team) and HR (everyone). HR also gets a department filter.
export default function AttendanceRecords({ title, url, hr }) {
  const dispatch = useDispatch();
  const { items, page, pages, loading } = useSelector((s) => s.attendance);
  const [date, setDate] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (hr) api.get("/employees/departments").then((r) => setDepartments(r.data.items)).catch(() => {});
  }, [hr]);

  const load = useCallback(
    (p = 1) => dispatch(attendance.fetchItems({ url, page: p, date: date || undefined, department: department || undefined })),
    [dispatch, url, date, department]
  );
  useEffect(() => { load(1); }, [load]);

  return (
    <>
      <PageHeader title={title} subtitle="Filter by day to see who was in.">
        <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        {hr && (
          <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
      </PageHeader>
      <div className="panel">
        {loading ? <Loading /> : items.length === 0 ? <Empty>No attendance records match these filters.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id}>
                    <td className="fw-semibold">{r.employee?.name}</td><td>{r.employee?.department}</td>
                    <td>{fmtDate(r.date)}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td>
                    <td>{r.checkOut ? r.hoursWorked : "—"}</td><td><Pill value={r.status} /></td>
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
