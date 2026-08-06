import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const cleanerPage = readFileSync(new URL("../app/cleaner/turnovers/[id]/page.tsx", import.meta.url), "utf8");
const proxy = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const header = readFileSync(new URL("../app/homepagecomponents/Header.tsx", import.meta.url), "utf8");

test("cleaner task photo import resolves to the existing component", () => {
  assert.equal(existsSync(new URL("../app/cleaner/TaskPhotoUpload.tsx", import.meta.url)), true);
  assert.match(cleanerPage, /from "\.\.\/\.\.\/TaskPhotoUpload"/);
});

test("public sign-in requests do not repeat stale-session auth lookups", () => {
  assert.match(proxy, /const protectedPortalPath = isProtectedPortalPath/);
  assert.match(proxy, /if \(url && key && protectedPortalPath\)/);
  assert.match(proxy, /expireAuthCookies\(NextResponse\.redirect\(loginUrl\)/);
});

test("the shared header gives the logo explicit width and height", () => {
  assert.match(header, /width=\{40\}[\s\S]*height=\{40\}[\s\S]*className="h-10 w-10"/);
});
