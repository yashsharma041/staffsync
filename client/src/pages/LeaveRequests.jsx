import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { errMsg } from "../api/axios";
import { leaves } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, ErrorNote, Loading, Notice, PageHeader, Pill } from "../components/ui";
import { fmtDate } from "../utils";

// Used by managers (url=/leaves/team) and HR (url=/leaves)
export default function LeaveRequests({ url, title }) {
  const dispatch = useDispatch();
  const { items, page, pages, loading } = useSelector((s) => s.leaves);
  const [status, setStatus] = useState("pending");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback((p = 1) => dispatch(leaves.fetchItems({ url, page: p, status: status || undefined })), [dispatch, url, status]);
  useEffect(() => { load(1); }, [load]);

  const review = async (leave, decision) => {
    const remarks = window.prompt(`${decision === "approved" ? "Approve" : "Reject"} ${leave.employee?.name}'s request.\nAdd a note (optional):`, "");
    if (remarks === null) return;
    setMsg(""); setErr("");
    try {
      await api.put(`/leaves/${leave._id}/review`, { status: decision, remarks });
      setMsg(`Request ${decision}.`);
      load(page);
    } catch (x) { setErr(errMsg(x)); }
  };

  return (
    <>
      <PageHeader title={title} subtitle="Approving deducts from the employee's leave balance.">
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="pending">Pending</option><option value="approved">Approved</option>
          <option value="rejected">Rejected</option><option value="">All</option>
        </select>
      </PageHeader>
      <Notice message={msg} />
      <ErrorNote message={err} />
      <div className="panel">
        {loading ? <Loading /> : items.length === 0 ? <Empty>No {status || ""} leave requests.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th /></tr></thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l._id}>
                    <td><div className="fw-semibold">{l.employee?.name}</div><small className="text-muted">{l.employee?.department}</small></td>
                    <td className="text-capitalize">{l.type}</td>
                    <td>{fmtDate(l.fromDate)} – {fmtDate(l.toDate)}</td>
                    <td>{l.days}</td>
                    <td style={{ maxWidth: 220 }} className="small">{l.reason}</td>
                    <td><Pill value={l.status} /></td>
                    <td className="text-nowrap">
                      {l.status === "pending" && (
                        <>
                          <button className="btn btn-sm btn-primary me-1" onClick={() => review(l, "approved")}>Approve</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => review(l, "rejected")}>Reject</button>
                        </>
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
