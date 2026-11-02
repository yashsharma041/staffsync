import { configureStore } from "@reduxjs/toolkit";
import auth from "../features/authSlice";
import { attendance, leaves, announcements, trainings, employees, notifications } from "../features/slices";

export default configureStore({
  reducer: {
    auth,
    attendance: attendance.reducer,
    leaves: leaves.reducer,
    announcements: announcements.reducer,
    trainings: trainings.reducer,
    employees: employees.reducer,
    notifications: notifications.reducer,
  },
});
