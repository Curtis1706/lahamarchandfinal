"use client";

import React from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DynamicDashboardLayout
      title=""
      breadcrumb=""
      showActions={false}
    >
      {children}
    </DynamicDashboardLayout>
  );
}

