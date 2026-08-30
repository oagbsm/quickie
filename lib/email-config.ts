export function resolveResendFromEmail(
  environment: { RESEND_FROM_EMAIL?: string },
) {
  return environment.RESEND_FROM_EMAIL?.trim() || null;
}

export function getResendFromEmail() {
  return resolveResendFromEmail({
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || process.env.TRANSACTIONAL_EMAIL_FROM,
  });
}

export function resolveResendReplyToEmail(environment: {
  RESEND_REPLY_TO_EMAIL?: string;
}) {
  return environment.RESEND_REPLY_TO_EMAIL?.trim() || null;
}

export function getResendReplyToEmail() {
  return resolveResendReplyToEmail({
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
  });
}
