export type OperatorState = { label: string; message: string; action?: string; attention?: string };
export function getOperatorState(status: string): OperatorState {
  switch (status) {
    case "unassigned": return { label: "Unassigned", message: "Cleaner needed", action: "Assign cleaner", attention: "needs a cleaner" };
    case "awaiting_response": return { label: "Assigned / awaiting response", message: "Cleaner invited / awaiting response", action: "Resend invitation", attention: "awaiting cleaner response" };
    case "accepted": return { label: "Accepted", message: "Cleaner accepted", attention: "accepted" };
    case "en_route": return { label: "En route", message: "Cleaner is en route", attention: "en route" };
    case "arrived": return { label: "Arrived", message: "Cleaner has arrived", attention: "arrived" };
    case "in_progress": return { label: "In progress", message: "Cleaning in progress", attention: "in progress" };
    case "action_required": return { label: "Action required", message: "Action required", attention: "needs attention" };
    case "ready": return { label: "Property ready", message: "Property ready", attention: "ready" };
    default: return { label: status.replaceAll("_", " "), message: status.replaceAll("_", " ") };
  }
}
