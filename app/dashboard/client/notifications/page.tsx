"use client";

import { NotificationsList } from "@/components/notifications/notifications-list";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";

export default function NotificationsPage() {
  return (
    <DynamicDashboardLayout title="Liste des notifications">
      <NotificationsList />
    </DynamicDashboardLayout>
  );
}