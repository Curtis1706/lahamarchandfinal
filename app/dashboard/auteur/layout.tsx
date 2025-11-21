"use client";

import React, { useState, useEffect } from "react";
import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout";
import { apiClient } from "@/lib/api-client";
import { GraduationCap } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [userDiscipline, setUserDiscipline] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await apiClient.getUserProfile();
        console.log("📋 Profil utilisateur:", profile);
        if (profile.discipline) {
          console.log("✅ Discipline trouvée:", profile.discipline);
          setUserDiscipline(profile.discipline);
        } else {
          console.log("⚠️ Aucune discipline assignée à cet auteur");
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement du profil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <DynamicDashboardLayout 
      title="Mes Œuvres" 
      breadcrumb={
        <div className="flex flex-col space-y-1">
          <span>Auteur</span>
          {!isLoading && userDiscipline && (
            <div className="flex items-center space-x-1.5 bg-slate-600/80 px-2.5 py-1 rounded-md w-fit">
              <GraduationCap className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">{userDiscipline.name}</span>
            </div>
          )}
        </div>
      }
    >
      {children}
    </DynamicDashboardLayout>
  );
}


