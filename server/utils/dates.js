// Local date as YYYY-MM-DD (used as the attendance day key)
const todayStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Inclusive number of days between two dates
const leaveDays = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b - a) / 86400000) + 1;
};

module.exports = { todayStr, leaveDays };
