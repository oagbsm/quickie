type MessageAttachment = { id: string; url: string | null; fileName?: string | null };

export default function MarketplaceMessageBubble({ body, isMine, attachments, createdAt }: { body?: string | null; isMine: boolean; attachments?: MessageAttachment[]; createdAt: string }) {
  const hasBody = Boolean(body?.trim());
  return <div className={`max-w-[82%] min-w-0 overflow-hidden break-words rounded-2xl p-3 text-sm leading-6 ${isMine ? "ml-auto bg-[#061b3f] text-white" : "bg-[#eef8f1]"}`}>{hasBody && <p className="whitespace-pre-wrap break-words">{body}</p>}{attachments?.filter((attachment) => attachment.url).map((attachment) => <a key={attachment.id} href={attachment.url || undefined} target="_blank" rel="noreferrer" className="mt-2 block max-w-full"><img src={attachment.url || ""} alt={attachment.fileName || "Conversation attachment"} className="max-h-48 max-w-full rounded-xl object-contain" /></a>)}<time className="mt-1.5 block text-[10px] leading-4 text-[#8190a3] opacity-80">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(createdAt))}</time></div>;
}
