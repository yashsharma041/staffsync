import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import api, { errMsg } from "../api/axios";
import { Empty, ErrorNote, Loading, PageHeader, Pill, StatCard } from "../components/ui";
import { fmtDate, fmtTime } from "../utils";

const COLORS = { pending: "#c98a1b", approved: "#1f6f6b", rejected: "#b4432f", cancelled: "#8a9599" };

function Announcements({ items }) {
  return (
    <div className="panel h-100">
      <div className="d-flex justify-content-between">
        <h5 className="panel-title">Latest announcements</h5>
        <Link to="/announcements">View all</Link>
      </div>
      {items.length === 0 && <Empty>No announcements yet.</Empty>}
      {items.map((a) => (
        <div key={a._id} className="mb-3">
          <div className="fw-semibold">{a.title}</div>
          <div className="text-muted small">{fmtDate(a.createdAt)} · {a.postedBy?.name}</div>
          <div className="text-truncate">{a.body}</div>
        </div>
      ))}
    </div>
  );
}

function Today({ today }) {
  return (
    <div className="stat accent">
      <div className="label">Today</div>
      {today ? (
        <>
          <div className="value fs-4">In at {fmtTime(today.checkIn)}</div>
          <div className="hint">{today.checkOut ? `Out at ${fmtTime(today.checkOut)}` : "Not checked out yet"} <Pill value={today.status} /></div>
        </>
      ) : (
        <>
          <div className="value fs-4">Not checked in</div>
          <Link to="/attendance">Go to attendance</Link>
        </>
      )}
    </div>
  );
}

function Balances({ b }) {
  if (!b) return null;
  return ["casual", "sick", "earned"].map((k) => (
    <div className="col-6 col-lg-3" key={k}>
      <StatCard label={`${k[0].toUpperCase() + k.slice(1)} leave`} value={b[k]} hint="days left" />
    </div>
  ));
}

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!data) return <Loading />;
  const first = user.employee?.name?.split(" ")[0] || "there";

  if (data.role === "hr")
    return (
      <>
        <PageHeader title={`Hello, ${first}`} subtitle="Company overview for today" />
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3"><StatCard accent label="Employees" value={data.totalEmployees} hint={`${data.activeUsers} active accounts`} /></div>
          <div className="col-6 col-lg-3"><StatCard label="Present today" value={data.presentToday} /></div>
          <div className="col-6 col-lg-3"><StatCard label="On leave today" value={data.onLeaveToday} /></div>
          <div className="col-6 col-lg-3"><StatCard label="Pending leave requests" value={data.pendingLeaves} hint={<Link to="/hr/leaves">Review</Link>} /></div>
        </div>
        <div className="row g-3">
          <div className="col-lg-7">
            <div className="panel">
              <h5 className="panel-title">Headcount by department</h5>
              {data.headcount.length === 0 ? <Empty>No employees yet.</Empty> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.headcount}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Employees" fill="#1f6f6b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="col-lg-5">
            <div className="panel">
              <h5 className="panel-title">Leave requests by status</h5>
              {data.leavesByStatus.length === 0 ? <Empty>No leave requests yet.</Empty> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.leavesByStatus} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90}>
                      {data.leavesByStatus.map((e) => <Cell key={e.status} fill={COLORS[e.status] || "#999"} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="col-12"><Announcements items={data.announcements} /></div>
        </div>
      </>
    );

  if (data.role === "manager")
    return (
      <>
        <PageHeader title={`Hello, ${first}`} subtitle="Your team today" />
        <div className="row g-3 mb-3">
          <div className="col-6 col-lg-3"><StatCard accent label="Team size" value={data.teamSize} hint={<Link to="/team">View team</Link>} /></div>
          <div className="col-6 col-lg-3"><StatCard label="Team present today" value={`${data.presentToday} / ${data.teamSize}`} /></div>
          <div className="col-6 col-lg-3"><StatCard label="Leave awaiting you" value={data.pendingLeaves} hint={<Link to="/team/leaves">Review</Link>} /></div>
          <div className="col-6 col-lg-3"><StatCard label="Active programmes" value={data.trainings} hint={<Link to="/trainings/manage">Manage</Link>} /></div>
        </div>
        <div className="row g-3">
          <div className="col-lg-4"><Today today={data.today} /></div>
          <div className="col-lg-8"><Announcements items={data.announcements} /></div>
        </div>
      </>
    );

  return (
    <>
      <PageHeader title={`Hello, ${first}`} subtitle="Your day at a glance" />
      <div className="row g-3 mb-3">
        <div className="col-lg-4"><Today today={data.today} /></div>
        <Balances b={data.leaveBalance} />
      </div>
      <div className="row g-3">
        <div className="col-lg-4">
          <StatCard label="Pending leave requests" value={data.pendingLeaves} hint={<Link to="/leaves">My leaves</Link>} />
          <div className="mt-3"><StatCard label="Training assigned" value={data.trainings} hint={<Link to="/trainings">View</Link>} /></div>
        </div>
        <div className="col-lg-8"><Announcements items={data.announcements} /></div>
      </div>
    </>
  );
}
