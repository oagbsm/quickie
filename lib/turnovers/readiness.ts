export type ReadinessInput = {
  completionSubmitted: boolean;
  mandatoryTasks: Array<{ completed: boolean }>;
  photoTasks: Array<{ hasPhoto: boolean }>;
  noteTasks: Array<{ note?: string | null }>;
  blockingTaskResults?: Array<{ response?: string | null }>;
  requiredPhotoCount: number;
  completionPhotoCount: number;
  keyReturnRequired: boolean;
  keyReturnConfirmed: boolean;
  unresolvedBlockingIssues: number;
};

export function evaluateReadiness(input: ReadinessInput) {
  const reasons: string[] = [];
  const incompleteTasks = input.mandatoryTasks.filter((task) => !task.completed).length;
  const missingTaskPhotos = input.photoTasks.filter((task) => !task.hasPhoto).length;
  const missingNotes = input.noteTasks.filter((task) => !task.note?.trim()).length;
  const missingPhotos = Math.max(input.requiredPhotoCount - input.completionPhotoCount, 0);
  const failedBlockingTasks = (input.blockingTaskResults || []).filter((task) => ["no", "fail"].includes(task.response || "")).length;

  if (!input.completionSubmitted) reasons.push("Completion has not been submitted");
  if (incompleteTasks) reasons.push(`${incompleteTasks} mandatory checklist task${incompleteTasks === 1 ? " is" : "s are"} incomplete`);
  if (missingTaskPhotos) reasons.push(`${missingTaskPhotos} task photo${missingTaskPhotos === 1 ? " is" : "s are"} missing`);
  if (missingNotes) reasons.push(`${missingNotes} required note${missingNotes === 1 ? " is" : "s are"} missing`);
  if (failedBlockingTasks) reasons.push(`${failedBlockingTasks} blocking checklist result${failedBlockingTasks === 1 ? " requires" : "s require"} attention`);
  if (missingPhotos) reasons.push(`${missingPhotos} completion photo${missingPhotos === 1 ? " is" : "s are"} missing`);
  if (input.keyReturnRequired && !input.keyReturnConfirmed) reasons.push("Key-return confirmation is missing");
  if (input.unresolvedBlockingIssues) reasons.push(`${input.unresolvedBlockingIssues} blocking issue${input.unresolvedBlockingIssues === 1 ? " remains" : "s remain"} open`);

  return { ready: reasons.length === 0, blockingReasons: reasons };
}
