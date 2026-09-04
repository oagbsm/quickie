-- The original attachment idempotency index was partial. PostgreSQL requires
-- the partial predicate in every ON CONFLICT target, while the API uses the
-- column target directly. A full unique index remains NULL-tolerant for legacy
-- rows and makes keyed attachment upserts valid.
drop index if exists public.marketplace_message_attachments_client_submission_uidx;

create unique index marketplace_message_attachments_client_submission_uidx
  on public.marketplace_message_attachments(message_id, client_message_id, client_attachment_index);
