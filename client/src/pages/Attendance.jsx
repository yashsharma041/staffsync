import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../api/axios";
import { attendance } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, ErrorNote, Loading, Notice, PageHeader, Pill } from "../components/ui";
import { fmtDate, fmtTime, today } from "../utils";

export default function Attendance() {
  const dispatch = useDispatch();
  const { items, page, pages, loading } = useSelector((s) => s.attendance);
  const [record, setRecord] = useState(null);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadToday = useCallback(async () => {
    const { data } = await api.get("/attendance/today");
    setRecord(data.record);
  }, []);
  const loadList = useCallback(
    (p = 1) => dispatch(attendance.fetchItems({ url: "/attendance/me", page: p, month: month || undefined })),
    [dispatch, month]
  );

  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => { loadList(1); }, [loadList]);

  const act = async (fn, ok) => {
    setMsg(""); setErr("");
    try {
      await fn();
      setMsg(ok);
      await Promise.all([loadToday(), loadList(1)]);
    } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="My attendance" subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />
      <Notice message={msg} />
      <ErrorNote message={err} />

      <div className="panel mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          {!record && <div className="fs-5">You have not checked in today.</div>}
          {record && (
            <div className="fs-5">
              Checked in at <strong>{fmtTime(record.checkIn)}</strong>
              {record.checkOut && <> · out at <strong>{fmtTime(record.checkOut)}</strong> ({record.hoursWorked} h)</>}
              {" "}<Pill value={record.status} />
            </div>
          )}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" disabled={!!record}
            onClick={() => act(() => api.post("/attendance/check-in"), "Checked in.")}>Check in</button>
          <button className="btn btn-outline-primary" disabled={!record || !!record.checkOut}
            onClick={() => act(() => api.put("/attendance/check-out"), "Checked out.")}>Check out</button>
        </div>
      </div>

      <div className="panel">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="panel-title mb-0">History</h5>
          <input type="month" className="form-control w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        {loading ? <Loading /> : items.length === 0 ? <Empty>No attendance records for this month.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id}>
                    <td>{fmtDate(r.date)}</td><td>{fmtTime(r.checkIn)}</td><td>{fmtTime(r.checkOut)}</td>
                    <td>{r.checkOut ? r.hoursWorked : "—"}</td><td><Pill value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} onChange={loadList} />
      </div>
    </>
  );
}
