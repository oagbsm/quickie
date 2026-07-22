import { createClient } from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key) throw new Error("Supabase service configuration is required");
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const accounts=[
  {id:"63b8a5dc-da38-4392-bdd4-c21ffe866410",name:"Quickola Pilot Portfolio",deleteUser:false,userId:"b3ed5bcf-d9bf-4626-99d1-777065f6a7a3"},
  {id:"6b1776f2-f703-470c-b724-93abec4af650",name:"abdi",deleteUser:true,userId:"3a1bcdc6-3684-4279-a029-d36ac3e09182"},
];
const provider={id:"ed97e254-cfc4-479f-bb7e-dd087215eab4",name:"cleanco"};
for(const target of accounts){
 const {data:account,error}=await db.from("business_accounts").select("id,name,owner_user_id").eq("id",target.id).maybeSingle();if(error)throw error;
 if(!account)continue;if(account.name!==target.name||account.owner_user_id!==target.userId)throw new Error(`Cleanup guard failed for ${target.id}`);
 const {data:bookings,error:bookingError}=await db.from("business_bookings").select("id").eq("account_id",target.id);if(bookingError)throw bookingError;const bookingIds=bookings.map(x=>x.id);
 if(bookingIds.length){for(const table of ["admin_audit_log","business_issues","booking_photos","invoices","completion_reports","booking_events"]){const column=table==="admin_audit_log"?"entity_id":"booking_id";const {error:e}=await db.from(table).delete().in(column,bookingIds);if(e)throw e;} const {error:e}=await db.from("business_bookings").delete().in("id",bookingIds);if(e)throw e;}
 for(const table of ["business_notifications","recurring_schedules","service_area_requests","terms_acceptances","properties","business_members"]){const {error:e}=await db.from(table).delete().eq("account_id",target.id);if(e)throw e;}
 const {error:accountDelete}=await db.from("business_accounts").delete().eq("id",target.id);if(accountDelete)throw accountDelete;
 if(target.deleteUser){const {error:e}=await db.auth.admin.deleteUser(target.userId);if(e)throw e;}
 else {const {data:{user},error:e}=await db.auth.admin.getUserById(target.userId);if(e)throw e;if(user){const {error:updateError}=await db.auth.admin.updateUserById(target.userId,{user_metadata:{...user.user_metadata,account_kind:"quickola_admin",business_name:null}});if(updateError)throw updateError;}}
}
const {data:providerRow,error:providerRead}=await db.from("service_providers").select("id,name").eq("id",provider.id).maybeSingle();if(providerRead)throw providerRead;
if(providerRow){if(providerRow.name.toLowerCase()!==provider.name)throw new Error("Cleanup guard failed for provider");const {error:e}=await db.from("service_providers").delete().eq("id",provider.id);if(e)throw e;}
console.log("Known synthetic Quickola pilot data removed; unrelated accounts were not queried for deletion.");
