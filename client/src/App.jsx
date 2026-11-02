import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadMe } from "./features/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Attendance = lazy(() => import("./pages/Attendance"));
const AttendanceRecords = lazy(() => import("./pages/AttendanceRecords"));
const Leaves = lazy(() => import("./pages/Leaves"));
const LeaveRequests = lazy(() => import("./pages/LeaveRequests"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Trainings = lazy(() => import("./pages/Trainings"));
const ManageTrainings = lazy(() => import("./pages/ManageTrainings"));
const Employees = lazy(() => import("./pages/Employees"));
const Team = lazy(() => import("./pages/Team"));

export default function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user) dispatch(loadMe());
    // eslint-disable-next-line
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/trainings" element={<Trainings />} />

            <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
              <Route path="/team" element={<Team />} />
              <Route
                path="/team/attendance"
                element={<AttendanceRecords title="Team attendance" url="/manager/team/attendance" />}
              />
              <Route path="/team/leaves" element={<LeaveRequests url="/leaves/team" title="Team leave requests" />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["hr"]} />}>
              <Route path="/employees" element={<Employees />} />
              <Route
                path="/attendance/all"
                element={<AttendanceRecords title="All attendance" url="/attendance" hr />}
              />
              <Route path="/hr/leaves" element={<LeaveRequests url="/leaves" title="All leave requests" />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["manager", "hr"]} />}>
              <Route path="/trainings/manage" element={<ManageTrainings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
