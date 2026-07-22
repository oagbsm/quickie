import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY, anonKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if(!url||!serviceKey||!anonKey) throw new Error("Supabase configuration required");
const root=createClient(url,serviceKey,{auth:{persistSession:false}}), nonce=crypto.randomUUID().slice(0,8), password=`Pilot-${crypto.randomUUID()}!`;
const createdUsers=[],createdAccounts=[],createdProviders=[];

async function makeUser(kind){
  const email=`quickola-${kind}-${nonce}@example.invalid`;
  const {data,error}=await root.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{account_kind:"quickola_business",business_name:`Disposable ${kind} ${nonce}`,full_name:`Test ${kind}`,customer_type:"property_manager"}});
  if(error)throw error;createdUsers.push(data.user.id);
  for(let i=0;i<20;i++){
    const {data:account}=await root.from("business_accounts").select("id").eq("owner_user_id",data.user.id).maybeSingle();
    if(account){createdAccounts.push(account.id);const client=createClient(url,anonKey,{auth:{persistSession:false}});const signed=await client.auth.signInWithPassword({email,password});if(signed.error)throw signed.error;return{client,user:data.user,accountId:account.id}}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error("workspace_not_created");
}
function payload(accountId,propertyId,idempotencyKey,start){return{account_id:accountId,property_id:propertyId,service:"regular_cleaning",scheduled_start:start,requirements:null,recurrence:"one_off",extras:[],status:"requested",pricing_version:"test",pricing_mode:"instant",pricing_breakdown:[],estimated_price_pence:5500,estimated_price_max_pence:null,duration_minutes:120,requires_manual_review:false,customer_price_accepted:true,customer_price_accepted_at:new Date().toISOString(),idempotency_key:idempotencyKey,actor_user_id:null}}
async function booking(accountId,propertyId,key,start){return root.rpc("server_create_business_booking",{payload:payload(accountId,propertyId,key,start)})}

try{
  const a=await makeUser("a"),b=await makeUser("b"),admin=await makeUser("admin");
  await root.from("admin_users").insert({user_id:admin.user.id,role:"admin",active:true});
  const {data:properties,error:propertyError}=await root.from("properties").insert([
    {account_id:a.accountId,nickname:"Disposable A",address_line_1:`${nonce} Alpha Road`,city:"Slough",postcode:"SL1 1AA",property_type:"flat",bedrooms:2,bathrooms:1,access_method:"contact",service_area_status:"eligible"},
    {account_id:b.accountId,nickname:"Disposable B",address_line_1:`${nonce} Beta Road`,city:"Slough",postcode:"SL2 2AA",property_type:"flat",bedrooms:1,bathrooms:1,access_method:"contact",service_area_status:"eligible"},
  ]).select();
  if(propertyError)throw propertyError;
  const pa=properties.find(property=>property.account_id===a.accountId),pb=properties.find(property=>property.account_id===b.accountId);

  const {data:crossProperty}=await a.client.from("properties").select("id").eq("id",pb.id);
  assert.equal(crossProperty.length,0,"customer A cannot read customer B property");
  await a.client.from("properties").update({nickname:"Cross-account mutation"}).eq("id",pb.id);
  const {data:unchangedProperty}=await root.from("properties").select("nickname").eq("id",pb.id).single();
  assert.equal(unchangedProperty.nickname,"Disposable B","customer A cannot alter customer B property");
  const forbiddenCreate=await a.client.rpc("server_create_business_booking",{payload:payload(b.accountId,pb.id,crypto.randomUUID(),"2026-08-12T09:00:00Z")});
  assert.ok(forbiddenCreate.error,"customer A cannot create a booking in customer B account");

  const key1=crypto.randomUUID(), first=await booking(a.accountId,pa.id,key1,"2026-08-10T09:00:00Z");assert.ifError(first.error);
  const repeated=await Promise.all(Array.from({length:5},()=>booking(a.accountId,pa.id,key1,"2026-08-10T09:00:00Z")));assert.ok(repeated.every(result=>!result.error&&result.data.id===first.data.id),"concurrent idempotent submissions return the original booking");
  const key2=crypto.randomUUID(), once=await booking(a.accountId,pa.id,key2,"2026-08-11T09:00:00Z"), twice=await booking(a.accountId,pa.id,key2,"2026-08-11T09:00:00Z");assert.ifError(once.error);assert.equal(once.data.id,twice.data.id,"repeat submission creates one booking");
  const concurrentOverlap=await Promise.all([booking(a.accountId,pa.id,crypto.randomUUID(),"2026-08-13T09:00:00Z"),booking(a.accountId,pa.id,crypto.randomUUID(),"2026-08-13T09:00:00Z")]);assert.equal(concurrentOverlap.filter(result=>!result.error).length,1,"one concurrent request wins the slot");assert.equal(concurrentOverlap.filter(result=>/booking_time_conflict/.test(result.error?.message||"")).length,1,"the competing overlapping request is rejected");
  const nonOverlap=await booking(a.accountId,pa.id,crypto.randomUUID(),"2026-08-11T12:00:00Z");assert.ifError(nonOverlap.error);

  const {data:crossBooking}=await b.client.from("business_bookings").select("id,requirements,assigned_provider_id").eq("id",once.data.id);assert.equal(crossBooking.length,0,"customer B cannot read customer A booking, notes or provider id");
  await b.client.from("business_bookings").update({requirements:"cross-account mutation"}).eq("id",once.data.id);
  const {data:unchangedBooking}=await root.from("business_bookings").select("requirements,status,price_pence").eq("id",once.data.id).single();assert.equal(unchangedBooking.requirements,null,"customer B cannot alter customer A booking");
  await a.client.from("business_bookings").update({status:"completed",price_pence:1}).eq("id",once.data.id);
  const {data:customerProtected}=await root.from("business_bookings").select("status,price_pence").eq("id",once.data.id).single();assert.equal(customerProtected.status,"requested");assert.notEqual(customerProtected.price_pence,1);
  await b.client.from("business_bookings").update({status:"cancelled",cancel_reason:"cross-account cancellation"}).eq("id",once.data.id);
  const {data:notCancelled}=await root.from("business_bookings").select("status,cancel_reason").eq("id",once.data.id).single();assert.equal(notCancelled.status,"requested","customer B cannot cancel customer A booking");assert.equal(notCancelled.cancel_reason,null);
  const unauthorized=await a.client.rpc("admin_transition_booking",{target_booking:once.data.id,next_status:"under_review",reason:null,completion_note:null});assert.ok(unauthorized.error);
  const anonymous=createClient(url,anonKey,{auth:{persistSession:false}});const {data:anonymousBookings}=await anonymous.from("business_bookings").select("id").eq("id",once.data.id);assert.equal(anonymousBookings.length,0,"unauthenticated booking read fails");
  const {data:hiddenProviders}=await a.client.from("service_providers").select("id,name,email,phone");assert.equal(hiddenProviders.length,0,"provider directory and contacts are not customer-readable");
  const {data:preAssignment}=await a.client.from("business_bookings").select("assigned_provider_id,service_providers:assigned_provider_id(name)").eq("id",once.data.id).single();assert.equal(preAssignment.assigned_provider_id,null);assert.equal(preAssignment.service_providers,null,"no provider details are exposed before assignment");

  const {data:providers,error:providerError}=await root.from("service_providers").insert([{name:`Disposable active ${nonce}`,status:"active",service_area:["SL1"]},{name:`Disposable inactive ${nonce}`,status:"paused",service_area:["SL1"]}]).select();if(providerError)throw providerError;createdProviders.push(...providers.map(provider=>provider.id));
  let action=await admin.client.rpc("admin_confirm_booking_price",{target_booking:once.data.id,price_pence:5500,override_reason:null});assert.ifError(action.error);
  action=await admin.client.rpc("admin_assign_provider",{target_booking:once.data.id,target_provider:providers[1].id});assert.ok(action.error,"inactive provider cannot be assigned");
  action=await admin.client.rpc("admin_assign_provider",{target_booking:once.data.id,target_provider:providers[0].id});assert.ifError(action.error);
  const {data:assignedProvider}=await a.client.from("service_providers").select("id,name").eq("id",providers[0].id).single();assert.equal(assignedProvider.id,providers[0].id,"customer can read the provider assigned to their own visible-stage booking");
  const {data:crossAssignedProvider}=await b.client.from("service_providers").select("id,name").eq("id",providers[0].id);assert.equal(crossAssignedProvider.length,0,"customer B cannot access provider information belonging to customer A");
  for(const state of ["on_the_way","arrived","in_progress","completed"]){action=await admin.client.rpc("admin_transition_booking",{target_booking:once.data.id,next_status:state,reason:null,completion_note:state==="completed"?"Disposable verification complete":null});assert.ifError(action.error)}
  assert.ok(action.data.completed_at);assert.equal(action.data.completed_by,admin.user.id);
  const invalidAfterCompletion=await admin.client.rpc("admin_transition_booking",{target_booking:once.data.id,next_status:"confirmed",reason:null,completion_note:null});assert.ok(invalidAfterCompletion.error,"completed lifecycle cannot move backwards");
  const {count}=await root.from("business_bookings").select("id",{count:"exact",head:true}).eq("account_id",a.accountId).eq("idempotency_key",key2);assert.equal(count,1);
  console.log("Disposable cross-account RLS, unauthenticated access, protected notes/provider fields, cancellation, concurrent idempotency/overlap, assignment and lifecycle checks passed.");
} finally {
  for(const accountId of createdAccounts){
    const {data:jobs}=await root.from("business_bookings").select("id").eq("account_id",accountId);const ids=jobs?.map(job=>job.id)||[];
    if(ids.length){for(const table of ["admin_audit_log","business_issues","booking_photos","invoices","completion_reports","booking_events"]){const column=table==="admin_audit_log"?"entity_id":"booking_id";await root.from(table).delete().in(column,ids)}await root.from("business_notifications").delete().eq("account_id",accountId);await root.from("business_bookings").delete().in("id",ids)}
    for(const table of ["recurring_schedules","service_area_requests","terms_acceptances","properties","business_members"]){await root.from(table).delete().eq("account_id",accountId)}
    await root.from("business_accounts").delete().eq("id",accountId);
  }
  if(createdProviders.length)await root.from("service_providers").delete().in("id",createdProviders);
  for(const id of createdUsers){await root.from("admin_users").delete().eq("user_id",id);await root.auth.admin.deleteUser(id)}
  const {count:residue}=await root.from("business_accounts").select("id",{count:"exact",head:true}).like("name",`Disposable % ${nonce}`);assert.equal(residue,0,"disposable verification accounts were cleaned up");
}
