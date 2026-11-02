import createListSlice from "./createListSlice";

export const attendance = createListSlice("attendance", "/attendance/me");
export const leaves = createListSlice("leaves", "/leaves/me");
export const announcements = createListSlice("announcements", "/announcements");
export const trainings = createListSlice("trainings", "/trainings/me");
export const employees = createListSlice("employees", "/employees");
export const notifications = createListSlice("notifications", "/notifications");
