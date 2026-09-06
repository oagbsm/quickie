import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ConversationReadRow = { id: string; customer_last_read_at?: string | null; provider_last_read_at?: string | null };
type MessageReadRow = { conversation_id: string; sender_id: string; created_at: string };

export function countUnreadMarketplaceMessages(conversations: ConversationReadRow[], messages: MessageReadRow[], viewerId: string, side: "customer" | "provider") {
  const readAt = new Map(conversations.map((conversation) => [conversation.id, side === "customer" ? conversation.customer_last_read_at : conversation.provider_last_read_at]));
  return messages.filter((message) => message.sender_id !== viewerId && (!readAt.get(message.conversation_id) || new Date(message.created_at).getTime() > new Date(readAt.get(message.conversation_id)!).getTime())).length;
}

export async function getMarketplaceUnreadMessageCount(viewerId: string, side: "customer" | "provider") {
  const admin = createSupabaseAdminClient();
  let conversations: ConversationReadRow[] = [];
  if (side === "customer") {
    const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", viewerId).maybeSingle();
    if (!customer) return 0;
    const { data } = await admin.from("marketplace_conversations").select("id,customer_last_read_at,provider_last_read_at").eq("customer_id", customer.id);
    conversations = data || [];
  } else {
    const { data } = await admin.from("marketplace_conversations").select("id,customer_last_read_at,provider_last_read_at").or(`provider_id.eq.${viewerId},bidder_user_id.eq.${viewerId}`);
    conversations = data || [];
  }
  if (!conversations.length) return 0;
  const { data: messages } = await admin.from("marketplace_messages").select("conversation_id,sender_id,created_at").in("conversation_id", conversations.map((conversation) => conversation.id));
  return countUnreadMarketplaceMessages(conversations, messages || [], viewerId, side);
}
