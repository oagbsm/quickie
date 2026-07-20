import "server-only";

type NotificationPayload = {
  telegramHtml: string;
};

export type NotificationResult = {
  telegramSent: boolean;
  errors: string[];
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendAdminNotifications(payload: NotificationPayload): Promise<NotificationResult> {
  const result: NotificationResult = { telegramSent: false, errors: [] };
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  const jobs: Promise<void>[] = [];

  if (telegramToken && telegramChatId) {
    jobs.push((async () => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: payload.telegramHtml,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
        if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
        result.telegramSent = true;
      } catch (error) {
        result.errors.push(`Telegram: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    })());
  } else {
    result.errors.push("Telegram: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
  }

  await Promise.all(jobs);
  return result;
}
