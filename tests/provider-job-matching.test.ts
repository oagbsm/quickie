import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isMarketplaceJobMatch, marketplaceJobDistrict } from "../lib/marketplace/provider-job-matching.ts";

const matcher = readFileSync(new URL("../lib/marketplace/provider-job-matching.ts", import.meta.url), "utf8");
const workPage = readFileSync(new URL("../app/work/page.tsx", import.meta.url), "utf8");
const jobDetail = readFileSync(new URL("../app/work/jobs/[id]/page.tsx", import.meta.url), "utf8");
const profileActions = readFileSync(new URL("../app/work/profile/actions.ts", import.meta.url), "utf8");

test("provider matching uses the provider's selected service area, not the SEO launch list", () => {
  assert.doesNotMatch(matcher, /ACTIVE_PUBLIC_SEO_POSTCODE_DISTRICTS/);
  assert.match(matcher, /marketplaceAreaDistrict\(area\.postcode_district\)/);
  assert.match(workPage, /isMarketplaceJobMatch/);
  assert.match(jobDetail, /isMarketplaceJobMatch/);
});

test("district matching accepts full, partial, lowercase, and whitespace-padded postcodes", () => {
  for (const value of ["SL8 5XX", "sl8 5xx", "SL8", "SL8 5", "  sl8   5xx  "]) {
    assert.equal(marketplaceJobDistrict(value), "SL8");
  }
  assert.match(matcher, /\.trim\(\)\.toUpperCase\(\)/);
  assert.match(matcher, /split\(\/\\s\+\//);
  assert.match(matcher, /\^\[A-Z\]\{1,2\}\\d\{1,2\}/);
  assert.match(matcher, /marketplaceAreaDistrict = marketplaceJobDistrict/);
});

test("matching requires both the selected service and selected area", () => {
  const job = { status: "posted", service: "home-maintenance", service_subtype: "waste-removal", postcode: "SL8 5XX" };
  const service = [{ category_slug: "home-maintenance", job_type_slug: "waste-removal", active: true }];
  assert.equal(isMarketplaceJobMatch(job, service, [{ postcode_district: "sl8", active: true }]), true);
  assert.equal(isMarketplaceJobMatch(job, service, [{ postcode_district: "sl6", active: true }]), false);
  assert.equal(isMarketplaceJobMatch(job, [{ category_slug: "home-maintenance", job_type_slug: "plumbing", active: true }], [{ postcode_district: "sl8", active: true }]), false);
  assert.equal(isMarketplaceJobMatch({ ...job, postcode: "SL8 5XX", status: "completed" }, service, [{ postcode_district: "SL8", active: true }]), false);
});

test("service areas are canonicalised before persistence", () => {
  assert.match(profileActions, /normaliseMarketplaceServiceAreas/);
  assert.match(profileActions, /postcode_district\) => \(\{ provider_id: provider\.providerId/);
});
