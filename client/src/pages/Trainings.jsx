import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { trainings } from "../features/slices";
import Pagination from "../components/Pagination";
import { Empty, Loading, PageHeader, Pill } from "../components/ui";
import { fmtDate } from "../utils";

export default function Trainings() {
  const dispatch = useDispatch();
  const { items, page, pages, loading } = useSelector((s) => s.trainings);
  const load = useCallback((p = 1) => dispatch(trainings.fetchItems({ url: "/trainings/me", page: p })), [dispatch]);
  useEffect(() => { load(1); }, [load]);

  return (
    <>
      <PageHeader title="My training" subtitle="Programmes you have been enrolled in." />
      <div className="panel">
        {loading ? <Loading /> : items.length === 0 ? <Empty>You are not enrolled in any training yet.</Empty> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Programme</th><th>Starts</th><th>Ends</th><th>Led by</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t._id}>
                    <td><div className="fw-semibold">{t.title}</div><small className="text-muted">{t.description}</small></td>
                    <td>{fmtDate(t.startDate)}</td><td>{fmtDate(t.endDate)}</td>
                    <td>{t.createdBy?.name}</td><td><Pill value={t.status} /></td>
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
