export type AssignmentView = {
  status: string;
  assigned_at?: string;
  workers: unknown;
};
export function currentAssignment<T extends AssignmentView>(assignments:T[]|null|undefined){
 return [...(assignments||[])].filter(item=>["pending","accepted"].includes(item.status)).sort((a,b)=>{
  const rank=(value:string)=>value==="accepted"?2:value==="pending"?1:0;
  return rank(b.status)-rank(a.status)||(b.assigned_at||"").localeCompare(a.assigned_at||"");
 })[0];
}
export function turnoverActionReason(item:{status:string;turnover_date:string;readiness_result?:{blocking_reasons?:string[]}|null},today=new Date().toISOString().slice(0,10)){
 if(item.turnover_date<today&&!["ready","cancelled"].includes(item.status))return"Turnover overdue";
 if(item.status==="unassigned")return"Cleaner not assigned";
 if(item.status==="awaiting_response")return"Cleaner response pending";
 if(item.status==="declined")return"Cleaner declined assignment";
 if(item.status==="action_required"){
  const reasons=item.readiness_result?.blocking_reasons||[];
  return reasons[0]||"Readiness requirements remain";
 }
 if(item.status==="in_progress")return"Cleaning in progress";
 if(item.status==="evidence_submitted")return"Completion evidence submitted";
 if(item.status==="ready")return"Property ready";
 if(item.status==="accepted")return"Cleaner confirmed";
 return item.status.replaceAll("_"," ").replace(/^./,letter=>letter.toUpperCase());
}
export function isImplausibleTurnoverDate(date:string,now=new Date()){
 const value=new Date(`${date}T12:00:00Z`),past=new Date(now),future=new Date(now);
 past.setUTCFullYear(past.getUTCFullYear()-1);future.setUTCFullYear(future.getUTCFullYear()+2);
 return Number.isNaN(value.getTime())||value<past||value>future;
}
