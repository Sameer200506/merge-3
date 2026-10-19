import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { NotificationItem } from "@/components/notifications/notification-item";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read";
import { getNotifications, getUserMap } from "@/lib/queries";
import { getDefaultSessionUser } from "@/lib/auth/session";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  // Default to the owner for SSR; the client store drives the active user for interactions.
  const currentUser = await getDefaultSessionUser();
  const [notifications, userMap] = await Promise.all([
    getNotifications(currentUser.id),
    getUserMap(),
  ]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : "You're all caught up"}
        actions={<MarkAllReadButton userId={currentUser.id} />}
      />

      {notifications.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
