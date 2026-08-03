import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("priority public pages describe BYO-cleaner STR coordination", () => {
  const pages = [
    read("app/how-it-works/page.tsx"),
    read("app/solutions/airbnb/page.tsx"),
    read("app/solutions/letting-agents/page.tsx"),
    read("app/service-area/page.tsx"),
    read("app/about/page.tsx"),
    read("app/homepagecomponents/HowItWorks.tsx"),
  ];
  const copy = pages.join("\n");
  assert.match(copy, /existing cleaners/);
  assert.match(copy, /STR turnover coordination/);
  assert.doesNotMatch(copy, /managed cleaning/i);
  assert.doesNotMatch(copy, /Quickola manages cleaner assignment/i);
  assert.doesNotMatch(copy, /Quickola coordinates the cleaner as part of the managed service/i);
});

test("active invitation fallback uses the operator's team language", () => {
  const actions = read("app/business/str-actions.ts");
  assert.match(actions, /account\?\.name \|\| "Your cleaning team"/);
  assert.doesNotMatch(actions, /A Quickola cleaning team/);
});
