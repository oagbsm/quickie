import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isActiveMarketplacePostcodeDistrict, ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS } from "../lib/marketplace/service-areas.ts";

const postJobActions = readFileSync(new URL("../app/post-job/actions.ts", import.meta.url), "utf8");
const profileActions = readFileSync(new URL("../app/work/profile/actions.ts", import.meta.url), "utf8");
const areaField = readFileSync(new URL("../app/work/profile/ServiceAreasField.tsx", import.meta.url), "utf8");

test("SL6 is the single active launch district", () => {
  assert.deepEqual(ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS, ["SL6"]);
  assert.equal(isActiveMarketplacePostcodeDistrict("SL6"), true);
  assert.equal(isActiveMarketplacePostcodeDistrict("sl6"), true);
  assert.equal(isActiveMarketplacePostcodeDistrict(" SL6 "), true);
  for (const value of ["SL1", "SL2", "SL3", "SL4", "SL5", "SL7", "SL8", "SL9", "RG1", "GU14"]) {
    assert.equal(isActiveMarketplacePostcodeDistrict(value), false);
  }
});

test("customer posting is gated server-side with the launch-area message", () => {
  assert.match(postJobActions, /marketplaceJobDistrict\(postcode\)/);
  assert.match(postJobActions, /isActiveMarketplacePostcodeDistrict/);
  assert.match(postJobActions, /Quickola is currently available in SL6 only\. More nearby areas are coming soon\./);
  assert.match(postJobActions, /if \(!isActiveMarketplacePostcodeDistrict\(marketplaceJobDistrict\(payload\.postcode\)\)\)/);
});

test("provider area selection is disabled in the UI and rejected by the server", () => {
  assert.match(areaField, /ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS/);
  assert.match(areaField, /Coming soon/);
  assert.match(areaField, /disabled=\{!active\}/);
  assert.match(profileActions, /areas\.some\(\(area\) => !isActiveMarketplacePostcodeDistrict\(area\)\)/);
});
