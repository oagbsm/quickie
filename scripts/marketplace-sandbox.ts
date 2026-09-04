import { getSandboxContext, SANDBOX_FIXTURE_EMAILS as emails, SANDBOX_FIXTURE_TOKEN as fixtureToken, SANDBOX_MARKER as FIXTURE, type SandboxAdminClient as AdminClient } from "./sandbox-guard.ts";

function fail(message: string): never { throw new Error(`[sandbox] ${message}`); }
function env(name: string) { const value = process.env[name]?.trim(); if (!value) fail(`${name} is required`); return value; }
const guard = () => getSandboxContext();
async function findUser(admin: AdminClient, email: string) {
  for (let page = 1; page < 20; page++) { const result = await admin.auth.admin.listUsers({ page, perPage: 100 }); if (result.error) fail(`listing auth users failed: ${result.error.message}`); const found = result.data.users.find((user) => user.email?.toLowerCase() === email); if (found) return found; if (result.data.users.length < 100) break; }
  return null;
}
async function ensureUser(admin: AdminClient, email: string, password: string, metadata: Record<string, string>) {
  const existing = await findUser(admin, email);
  if (existing) return existing;
  const result = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { ...metadata, sandbox_fixture: true } });
  if (result.error || !result.data.user) fail(`creating ${email} failed: ${result.error?.message || "unknown"}`);
  return result.data.user;
}
async function check(admin: AdminClient) {
  const result = await admin.from("marketplace_jobs").select("id").limit(1);
  if (result.error) fail(`database check failed: ${result.error.message}`);
  console.log(JSON.stringify({ sandbox: true, site: process.env.NEXT_PUBLIC_SITE_URL, supabaseHost: new URL(env("NEXT_PUBLIC_SUPABASE_URL")).hostname, stripeTestMode: true, databaseReachable: true }));
}
async function seed(admin: AdminClient) {
  const password = env("SANDBOX_FIXTURE_PASSWORD");
  if (password.length < 12) fail("SANDBOX_FIXTURE_PASSWORD must be at least 12 characters");
  const account = await ensureUser(admin, emails.customer, password, { account_kind: "quickola_customer" });
  const providerUser = await ensureUser(admin, emails.provider, password, { account_kind: "quickola_provider" });
  const adminUser = await ensureUser(admin, emails.admin, password, { account_kind: "quickola_admin" });
  const connectedAccount = env("SANDBOX_STRIPE_CONNECTED_ACCOUNT_ID");
  const customer = await admin.from("marketplace_customers").upsert({ auth_user_id: account.id, email: emails.customer, display_name: "Sandbox Customer", mobile: null }, { onConflict: "auth_user_id" }).select("id").single();
  if (customer.error || !customer.data) fail(`customer fixture failed: ${customer.error?.message}`);
  const provider = await admin.from("marketplace_providers").upsert({ user_id: providerUser.id, display_name: "Sandbox Provider", business_name: "Quickola Sandbox Services", phone: "0000000000", base_town: "Maidenhead", postcode: "SL6 5RF", postcode_district: "SL6", provider_status: "approved", stripe_status: "ready", stripe_account_id: connectedAccount, marketplace_active: true, provider_terms_accepted_at: new Date().toISOString(), terms_version: "sandbox", marketplace_bio: FIXTURE }, { onConflict: "user_id" }).select("user_id").single();
  if (provider.error || !provider.data) fail(`provider fixture failed: ${provider.error?.message}`);
  await admin.from("admin_users").upsert({ user_id: adminUser.id, role: "admin", active: true }, { onConflict: "user_id" });
  const service = await admin.from("marketplace_provider_services").upsert({ provider_id: providerUser.id, category_slug: "cleaning", job_type_slug: "pressure-washing", active: true }, { onConflict: "provider_id,job_type_slug" });
  if (service.error) fail(`provider service fixture failed: ${service.error.message}`);
  const area = await admin.from("marketplace_provider_service_areas").upsert({ provider_id: providerUser.id, postcode_district: "SL6", active: true }, { onConflict: "provider_id,postcode_district" });
  if (area.error) fail(`provider area fixture failed: ${area.error.message}`);
  const job = await admin.from("marketplace_jobs").upsert({ public_token: fixtureToken, customer_id: customer.data.id, service: "cleaning", service_subtype: "pressure-washing", postcode: "SL6 5RF", requested_timing: "Sandbox test timing", optional_note: `${FIXTURE} Normal and dispute lifecycle fixture`, contact_method: "email", contact_value: emails.customer, contact_name: "Sandbox Customer", status: "posted" }, { onConflict: "public_token" }).select("id,public_token").single();
  if (job.error || !job.data) fail(`job fixture failed: ${job.error?.message}`);
  console.log(JSON.stringify({ sandbox: true, customerEmail: emails.customer, providerEmail: emails.provider, adminEmail: emails.admin, jobId: job.data.id, publicToken: job.data.public_token, stripeConnectedAccount: connectedAccount }));
}
async function reset(admin: AdminClient, productionOverride: boolean, dryRun: boolean) {
  if (productionOverride && !dryRun && process.env.QUICKOLA_SANDBOX_RESET_CONFIRM !== "DELETE_SANDBOX_FIXTURES_ONLY") fail("production-database reset requires QUICKOLA_SANDBOX_RESET_CONFIRM=DELETE_SANDBOX_FIXTURES_ONLY");
  const customerUser = await findUser(admin, emails.customer); const providerUser = await findUser(admin, emails.provider); const ids = [customerUser?.id, providerUser?.id].filter(Boolean) as string[];
  const customers = ids.length ? await admin.from("marketplace_customers").select("id").in("auth_user_id", ids) : { data: [] as { id: string }[] };
  const customerIds = (customers.data || []).map((row) => row.id);
  const jobs = customerIds.length ? await admin.from("marketplace_jobs").select("id").in("customer_id", customerIds).like("optional_note", `${FIXTURE}%`) : { data: [] as { id: string }[] };
  const jobIds = (jobs.data || []).map((row) => row.id);
  const provider = providerUser ? await admin.from("marketplace_providers").select("user_id,marketplace_bio").eq("user_id", providerUser.id).eq("marketplace_bio", FIXTURE).maybeSingle() : { data: null };
  if (dryRun) { console.log(JSON.stringify({ sandbox: true, dryRun: true, wouldDelete: { jobs: jobIds, customerIds, providerIds: provider.data ? [providerUser?.id] : [], authEmails: Object.values(emails) } })); return; }
  if (jobIds.length) {
    for (const table of ["marketplace_refunds", "marketplace_disputes", "marketplace_reviews", "marketplace_email_notifications", "marketplace_email_deliveries", "marketplace_messages", "marketplace_conversations", "marketplace_bookings", "marketplace_quotes", "marketplace_job_photos"]) { const result = await admin.from(table).delete().in("job_id", jobIds); if (result.error && !/relation|column/i.test(result.error.message)) fail(`reset ${table} failed: ${result.error.message}`); }
    const deleted = await admin.from("marketplace_jobs").delete().in("id", jobIds); if (deleted.error) fail(`reset jobs failed: ${deleted.error.message}`);
  }
  if (provider.data && providerUser) { const services = await admin.from("marketplace_provider_services").delete().eq("provider_id", providerUser.id).eq("category_slug", "cleaning").eq("job_type_slug", "pressure-washing"); if (services.error) fail(`reset provider service failed: ${services.error.message}`); const areas = await admin.from("marketplace_provider_service_areas").delete().eq("provider_id", providerUser.id).eq("postcode_district", "SL6"); if (areas.error) fail(`reset provider area failed: ${areas.error.message}`); const profile = await admin.from("marketplace_providers").delete().eq("user_id", providerUser.id).eq("marketplace_bio", FIXTURE); if (profile.error) fail(`reset provider failed: ${profile.error.message}`); }
  for (const email of Object.values(emails)) { const user = await findUser(admin, email); if (user) { const result = await admin.auth.admin.deleteUser(user.id); if (result.error) fail(`reset auth user failed: ${result.error.message}`); } }
  console.log(JSON.stringify({ sandbox: true, reset: true, deletedFixtureJobs: jobIds.length, deletedFixtureUsers: Object.values(emails).length }));
}
const command = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
try { const context = guard(); if (command === "check") { await check(context.admin); console.log(JSON.stringify({ sandboxMode: true, productionDbOverride: context.productionOverride, supabaseTargetAcceptedIntentionally: context.productionOverride, stripeTestModeConfirmed: true, siteUrlConfirmed: true })); } else if (command === "seed") await seed(context.admin); else if (command === "reset") await reset(context.admin, context.productionOverride, dryRun); else fail("command must be check, seed, or reset"); } catch (error) { console.error(error instanceof Error ? error.message : "sandbox command failed"); process.exitCode = 1; }
