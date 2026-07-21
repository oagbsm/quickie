"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const value=(f:FormData,n:string)=>String(f.get(n)||"").trim();
const optional=(f:FormData,n:string)=>value(f,n)||null;
const numberOrNull=(f:FormData,n:string)=>{const v=value(f,n);return v?Number(v):null};

export async function addProperty(formData:FormData){
  const {supabase,accountId}=await requireBusinessUser();
  const nickname=value(formData,"nickname"), address=value(formData,"addressLine1"), city=value(formData,"city"), postcode=value(formData,"postcode").toUpperCase(), propertyType=value(formData,"propertyType"), accessMethod=value(formData,"accessMethod");
  if(!nickname||!address||!city||!postcode||!propertyType||!accessMethod) redirect("/business/properties/new?error=required");
  const {error}=await supabase.from("properties").insert({account_id:accountId,nickname,address_line_1:address,address_line_2:optional(formData,"addressLine2"),city,postcode,property_type:propertyType,bedrooms:numberOrNull(formData,"bedrooms"),bathrooms:numberOrNull(formData,"bathrooms"),approximate_size:numberOrNull(formData,"approximateSize"),access_method:accessMethod,access_notes:optional(formData,"accessNotes"),parking_notes:optional(formData,"parkingNotes")});
  if(error) redirect(`/business/properties/new?error=${encodeURIComponent(error.message)}`);
  redirect(value(formData,"returnTo")==="onboarding"?"/business/onboarding?step=setup":"/business/properties?created=1");
}

export async function updateProperty(formData:FormData){
  const {supabase,accountId}=await requireBusinessUser();const id=value(formData,"id");
  const {error}=await supabase.from("properties").update({nickname:value(formData,"nickname"),address_line_1:value(formData,"addressLine1"),address_line_2:optional(formData,"addressLine2"),city:value(formData,"city"),postcode:value(formData,"postcode").toUpperCase(),property_type:value(formData,"propertyType"),bedrooms:numberOrNull(formData,"bedrooms"),bathrooms:numberOrNull(formData,"bathrooms"),approximate_size:numberOrNull(formData,"approximateSize"),access_method:value(formData,"accessMethod"),access_notes:optional(formData,"accessNotes"),parking_notes:optional(formData,"parkingNotes"),updated_at:new Date().toISOString()}).eq("id",id).eq("account_id",accountId);
  if(error) redirect(`/business/properties/${id}?error=${encodeURIComponent(error.message)}`);revalidatePath(`/business/properties/${id}`);redirect(`/business/properties/${id}?updated=1`);
}
export async function setPropertyStatus(formData:FormData){const{supabase,accountId}=await requireBusinessUser();const id=value(formData,"id"),status=value(formData,"status");if(!["active","archived"].includes(status))return;await supabase.from("properties").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("account_id",accountId);revalidatePath("/business/properties");revalidatePath(`/business/properties/${id}`)}

export async function createBooking(formData:FormData){const{supabase,accountId}=await requireBusinessUser();const propertyId=value(formData,"propertyId"),service=value(formData,"service"),date=value(formData,"date"),time=value(formData,"time");if(!propertyId||!service||!date||!time)redirect("/business/bookings/new?error=required");const {data:property}=await supabase.from("properties").select("id").eq("id",propertyId).eq("account_id",accountId).eq("status","active").maybeSingle();if(!property)redirect("/business/bookings/new?error=property");const unusual=["end_of_tenancy","after_builders"].includes(service);const payload:Record<string,unknown>={account_id:accountId,property_id:propertyId,service,scheduled_start:new Date(`${date}T${time}`).toISOString(),requirements:optional(formData,"requirements"),recurrence:value(formData,"recurrence")||"one_off",status:unusual?"awaiting_review":"submitted"};if(service==="airbnb_turnover"){payload.checkout_at=new Date(`${date}T${value(formData,"checkoutTime")||time}`).toISOString();const checkin=value(formData,"nextCheckin");if(checkin)payload.next_checkin_at=new Date(checkin).toISOString();payload.ready_by=payload.next_checkin_at;for(const name of ["linenRequired","laundryRequired","restockingRequired","damageCheckRequired"])payload[name.replace(/[A-Z]/g,m=>`_${m.toLowerCase()}`)]=formData.get(name)==="on"}const{error}=await supabase.from("business_bookings").insert(payload);if(error)redirect(`/business/bookings/new?error=${encodeURIComponent(error.message)}`);redirect("/business/bookings?created=1")}

export async function acceptTerms(formData:FormData){const{supabase,user,accountId}=await requireBusinessUser();const version=value(formData,"termsVersion");if(version!=="business-draft-2026-07")redirect("/business/onboarding?error=terms");await supabase.from("terms_acceptances").upsert({account_id:accountId,user_id:user.id,terms_version:version},{onConflict:"account_id,user_id,terms_version"});redirect("/business/dashboard")}
export async function signOut(){const supabase=await createSupabaseServerClient();await supabase.auth.signOut();redirect("/business/sign-in")}
