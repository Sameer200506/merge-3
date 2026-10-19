import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { getActivities, getUserMap } from "@/lib/queries";
import { Activity as ActivityIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const [activities, userMap] = await Promise.all([getActivities(100), getUserMap()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Feed"
        description="Everything happening across your workspace."
      />

      <Card>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ActivityIcon className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          </div>
        ) : (
          <ActivityFeed activities={activities} users={userMap} className="p-3" />
        )}
      </Card>
    </div>
  );
}
