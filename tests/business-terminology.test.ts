import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("business navigation uses customer-facing cleaning terminology", () => {
  const desktop = read("app/business/components/PortalNav.tsx");
  const mobile = read("app/business/components/MobilePortalShell.tsx");

  for (const label of ["Bookings", "Cleans", "Cleaners"]) {
    assert.match(desktop, new RegExp(`\\["${label}"`));
    assert.match(mobile, new RegExp(`\\["${label}"`));
  }
  assert.doesNotMatch(desktop, /\["Issues"|\["Activity"/);
  assert.doesNotMatch(mobile, /\["Issues"|\["Activity"/);
});

test("business pages present bookings and cleans without changing internal routes", () => {
  const dashboard = read("app/business/dashboard/page.tsx");
  const bookings = read("app/business/reservations/page.tsx");
  const cleans = read("app/business/turnovers/page.tsx");

  assert.match(dashboard, /Cleaning overview/);
  assert.match(dashboard, /Upcoming cleans/);
  assert.match(bookings, /<h1[^>]*>Bookings<\/h1>/);
  assert.match(bookings, /Add booking/);
  assert.match(cleans, /<h1[\s\S]*?Cleans[\s\S]*?<\/h1>/);
  assert.match(cleans, /Add clean/);
  assert.match(bookings, /\/business\/reservations\/new/);
  assert.match(cleans, /\/business\/turnovers\/new/);
});

test("business sidebar uses turnover-coordination positioning", () => {
  const layout = read("app/business/dashboard/layout.tsx");
  const obsolete = ["Managed", "cleaning for STR properties"].join(" ");
  assert.match(layout, /STR turnover coordination/);
  assert.doesNotMatch(layout, new RegExp(obsolete));
});
