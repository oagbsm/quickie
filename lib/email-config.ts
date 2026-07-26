export function resolveResendFromEmail(
  environment: { RESEND_FROM_EMAIL?: string; FROM_EMAIL?: string },
) {
  return (
    environment.RESEND_FROM_EMAIL?.trim() ||
    environment.FROM_EMAIL?.trim() ||
    null
  );
}

export function getResendFromEmail() {
  return resolveResendFromEmail({
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    FROM_EMAIL: process.env.FROM_EMAIL,
  });
}
