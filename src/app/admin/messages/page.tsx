import { getMessages } from "@/lib/data-fetcher";
import { MessagesInbox } from "@/components/admin/MessagesInbox";
import { AdminSavePublishBar } from "@/components/admin/AdminSavePublishBar";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getMessages(100);
  const unread = messages.filter((m) => !m.is_read).length;
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Messages</h1>
      <p className="mb-6 mt-1 text-sm text-muted">{messages.length} total · {unread} unread</p>
      <MessagesInbox messages={messages} />
      <AdminSavePublishBar section="messages" label="messages" expected={null} />
    </div>
  );
}
