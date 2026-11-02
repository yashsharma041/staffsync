const { leaveDays, todayStr } = require("../utils/dates");

describe("leaveDays", () => {
  test("same day counts as 1", () => expect(leaveDays("2026-03-02", "2026-03-02")).toBe(1));
  test("inclusive range", () => expect(leaveDays("2026-03-02", "2026-03-06")).toBe(5));
});

describe("todayStr", () => {
  test("formats as YYYY-MM-DD", () => expect(todayStr(new Date(2026, 0, 5))).toBe("2026-01-05"));
});
