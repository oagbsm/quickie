import MessagesPage from "@/app/messages/[conversationId]/page";

export default function ProviderConversationPage({ params, searchParams }: { params: Promise<{ conversationId: string }>; searchParams: Promise<{ error?: string }> }) {
  return <MessagesPage params={params} searchParams={searchParams} providerOnly />;
}
