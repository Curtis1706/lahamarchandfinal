"use client";

import React from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DynamicDashboardLayout title="Tableau de bord Partenaire" breadcrumb="Partenaire">
      {children}
    </DynamicDashboardLayout>
  );
}


