import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const index = read("app/messages/page.tsx");
const conversation = read("app/messages/[conversationId]/page.tsx");
const upload = read("app/api/marketplace/messages/route.ts");
const composer = read("app/messages/MessageComposer.tsx");
const migration = read("supabase/migrations/202608290002_marketplace_message_attachments.sql");

test("provider messaging stays on provider routes while customer routes remain separate", () => {
  assert.ok(index.includes('providerOnly ? "/work/messages"'));
  assert.ok(index.includes('isProvider ? `/work/messages/${conversation.id}` : `/messages/${conversation.id}`'));
  assert.match(conversation, /providerOnly && account\.role !== "provider"/);
  assert.match(conversation, /conversation\.provider_id === provider\.providerId/);
  assert.match(conversation, /providerOnly \? requireProviderWorkspaceAccess/);
});

test("message attachments are private, validated, and participant-authorized", () => {
  assert.match(upload, /marketplace-message-attachments/);
  assert.match(upload, /ALLOWED_TYPES/);
  assert.match(upload, /attachmentMeta/);
  assert.match(upload, /file\.size > MAX_FILE_SIZE/);
  assert.match(upload, /!isProvider && !isCustomer/);
  assert.ok(upload.includes("${conversationId}/${user.id}"));
  assert.match(composer, /multiple/);
  assert.match(composer, /image\/jpeg,image\/png,image\/webp/);
  assert.match(composer, /new FormData\(\)/);
  assert.match(composer, /formData\.append\("attachments", file, file\.name\)/);
  assert.match(conversation, /createSignedUrl\(attachment\.storage_path/);
  assert.match(migration, /public\.marketplace_message_attachments/);
  assert.ok(migration.includes("false, 5242880"));
  assert.match(migration, /conversation participants view message attachments/);
});

test("messages may contain text, images, or both but not neither", () => {
  assert.match(upload, /rawFiles\.filter\(\(value\): value is File => value instanceof File\)/);
  assert.match(upload, /!body && files\.length === 0/);
  assert.match(upload, /body: body \|\| null/);
  assert.match(migration, /body is null or length\(trim\(body\)\) between 1 and 4000/);
});
