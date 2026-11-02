import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authSlice";
import { notifications } from "../features/slices";
import api from "../api/axios";
import { fmtDate } from "../utils";

const NAV = {
  employee: [
    ["Dashboard", "/dashboard"],
    ["My attendance", "/attendance"],
    ["My leaves", "/leaves"],
    ["Announcements", "/announcements"],
    ["My training", "/trainings"],
    ["My profile", "/profile"],
  ],
  manager: [
    ["Dashboard", "/dashboard"],
    ["My attendance", "/attendance"],
    ["My leaves", "/leaves"],
    ["group", "Team"],
    ["Team members", "/team"],
    ["Team attendance", "/team/attendance"],
    ["Leave requests", "/team/leaves"],
    ["Training programmes", "/trainings/manage"],
    ["group", "Company"],
    ["Announcements", "/announcements"],
    ["My profile", "/profile"],
  ],
  hr: [
    ["Dashboard", "/dashboard"],
    ["group", "People"],
    ["Employees", "/employees"],
    ["All attendance", "/attendance/all"],
    ["Leave requests", "/hr/leaves"],
    ["group", "Company"],
    ["Announcements", "/announcements"],
    ["Training programmes", "/trainings/manage"],
    ["group", "Me"],
    ["My attendance", "/attendance"],
    ["My leaves", "/leaves"],
    ["My profile", "/profile"],
  ],
};

function Bell() {
  const dispatch = useDispatch();
  const { items, unread } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);

  const load = () => dispatch(notifications.fetchItems({ limit: 8 }));
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  const readOne = async (n) => {
    if (!n.read) {
      await api.put(`/notifications/${n._id}/read`);
      load();
    }
  };
  const readAll = async () => {
    await api.put("/notifications/read-all");
    load();
  };

  return (
    <div className="position-relative">
      <button className="bell" onClick={() => setOpen(!open)} aria-expanded={open}>
        Notifications
        {unread > 0 && <span className="count">{unread}</span>}
      </button>
      {open && (
        <div className="notif-menu">
          <div className="d-flex justify-content-between align-items-center p-2 px-3 border-bottom">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button className="btn btn-link btn-sm p-0" onClick={readAll}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 && <div className="empty">You are all caught up.</div>}
          {items.map((n) => (
            <div key={n._id} className={`notif-item ${n.read ? "" : "unread"}`} onClick={() => readOne(n)}>
              {n.message}
              <div><small>{fmtDate(n.createdAt)}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <NavLink to="/dashboard" className="brand">
          Staff<span>Sync</span>
        </NavLink>
        <nav onClick={() => setOpen(false)}>
          {NAV[user.role].map(([label, to], i) =>
            label === "group" ? (
              <div key={i} className="nav-group">{to}</div>
            ) : (
              <NavLink key={to} to={to} end className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>
                {label}
              </NavLink>
            )
          )}
        </nav>
        <div className="side-user">
          <div className="fw-semibold">{user.employee?.name || user.email}</div>
          <div className="role">{user.role}</div>
          <button className="btn btn-link btn-sm p-0 mt-1 text-info" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn btn-outline-secondary btn-sm menu-btn" onClick={() => setOpen(!open)}>Menu</button>
          <div className="text-muted d-none d-md-block">{user.employee?.department} · {user.employee?.designation}</div>
          <Bell />
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
