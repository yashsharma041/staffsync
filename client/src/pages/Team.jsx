import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/axios";
import Pagination from "../components/Pagination";
import { Empty, ErrorNote, Loading, PageHeader } from "../components/ui";
import { fmtDate } from "../utils";

export default function Team() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback((p = 1) => {
    api.get("/manager/team", { params: { page: p } }).then((r) => setData(r.data)).catch((e) => setErr(errMsg(e)));
  }, []);
  useEffect(() => { load(1); }, [load]);

  return (
    <>
      <PageHeader title="Team members" subtitle="People who report to you. HR assigns team members." />
      <ErrorNote message={err} />
      <div className="panel">
        {!data ? <Loading /> : data.items.length === 0 ? <Empty>No one reports to you yet. Ask HR to assign team members.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Job title</th><th>Department</th><th>Phone</th><th>Joined</th></tr></thead>
              <tbody>
                {data.items.map((m) => (
                  <tr key={m._id}>
                    <td className="fw-semibold">{m.name}</td><td>{m.user?.email}</td><td>{m.designation}</td>
                    <td>{m.department}</td><td>{m.phone || "—"}</td><td>{fmtDate(m.joinDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pagination page={data.page} pages={data.pages} onChange={load} />}
      </div>
    </>
  );
}
