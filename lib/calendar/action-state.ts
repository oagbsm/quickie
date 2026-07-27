export type CalendarActionState = {
  status: "idle" | "success" | "error";
  message: string;
  summary: string;
  fieldErrors: Partial<Record<"provider" | "displayName" | "calendarUrl", string>>;
};

export const initialCalendarActionState: CalendarActionState = {
  status: "idle",
  message: "",
  summary: "",
  fieldErrors: {},
};
