export type TaskCompletionEvidence = {
  work_item_id?: string;
  checklist_task_id: string | null;
  evidence_type?: string;
  storage_path?: string | null;
};

export function hasRequiredTaskPhoto(taskId: string, workItemId: string, evidence: TaskCompletionEvidence[]) {
  return evidence.some((entry) =>
    entry.work_item_id === workItemId &&
    entry.checklist_task_id === taskId &&
    entry.evidence_type === "completion_photo" &&
    Boolean(entry.storage_path?.trim()),
  );
}

export function isTaskEffectivelyComplete(task: { id: string; completed: boolean; photo_required: boolean }, workItemId: string, evidence: TaskCompletionEvidence[]) {
  return task.completed && (!task.photo_required || hasRequiredTaskPhoto(task.id, workItemId, evidence));
}
