import { getCleanerLifecycle } from "@/lib/cleaner/lifecycle";

export default function CleanerStatus({ status }: { status: string }) {
  const state = getCleanerLifecycle(status);
  return <span className="portal-pill whitespace-nowrap shrink-0" data-state={state.key}>{state.label}</span>;
}
