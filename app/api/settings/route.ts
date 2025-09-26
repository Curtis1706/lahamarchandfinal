import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simulation des paramètres globaux (en production, ceci devrait être stocké en base)
const DEFAULT_SETTINGS = {
  platform: {
    name: "LAHA Marchand",
    description: "Plateforme de distribution d'œuvres éducatives",
    email: "contact@lahamarchand.com",
    phone: "+241 XX XX XX XX",
    address: "Libreville, Gabon",
    website: "https://lahamarchand.com",
    logo: "/images/laha-logo.png"
  },
  business: {
    defaultTva: 0.18, // 18% TVA par défaut
    currency: "EUR",
    minOrderAmount: 0,
    maxOrderAmount: 10000,
    orderTimeout: 30, // jours
    returnPeriod: 14 // jours
  },
  stock: {
    defaultMinStock: 10,
    defaultMaxStock: 1000,
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    autoReorder: false
  },
  pricing: {
    authorRoyaltyRate: 0.10, // 10% pour les auteurs
    conceptorRoyaltyRate: 0.05, // 5% pour les concepteurs
    partnerCommissionRate: 0.15, // 15% pour les partenaires
    representantCommissionRate: 0.08 // 8% pour les représentants
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    lowStockAlerts: true,
    orderAlerts: true,
    userRegistrationAlerts: true
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 480, // minutes (8 heures)
    maxLoginAttempts: 5,
    lockoutDuration: 30 // minutes
  },
  audit: {
    logRetentionDays: 365,
    enableDetailedLogging: true,
    logUserActions: true,
    logSystemEvents: true
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (category && DEFAULT_SETTINGS[category as keyof typeof DEFAULT_SETTINGS]) {
      return NextResponse.json({
        category,
        settings: DEFAULT_SETTINGS[category as keyof typeof DEFAULT_SETTINGS]
      });
    }

    return NextResponse.json({
      settings: DEFAULT_SETTINGS
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, settings } = body;

    if (!category || !settings) {
      return NextResponse.json(
        { error: "Catégorie et paramètres requis" },
        { status: 400 }
      );
    }

    // En production, ceci devrait sauvegarder en base de données
    // Pour l'instant, on simule la sauvegarde
    console.log(`Updating settings for category: ${category}`, settings);

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: `SETTINGS_UPDATE_${category.toUpperCase()}`,
        performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
        details: JSON.stringify({
          category,
          settings,
          timestamp: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({
      message: "Paramètres mis à jour avec succès",
      category,
      settings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "reset_to_defaults":
        return await resetToDefaults();
      case "export_settings":
        return await exportSettings();
      case "validate_settings":
        return await validateSettings(body.settings);
      default:
        return NextResponse.json(
          { error: "Action non reconnue" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in settings action:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'exécution de l'action" },
      { status: 500 }
    );
  }
}

async function resetToDefaults() {
  // Créer un log d'audit
  await prisma.auditLog.create({
    data: {
      action: "SETTINGS_RESET_TO_DEFAULTS",
      performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
      details: JSON.stringify({
        timestamp: new Date().toISOString(),
        reason: "Réinitialisation des paramètres aux valeurs par défaut"
      })
    }
  });

  return NextResponse.json({
    message: "Paramètres réinitialisés aux valeurs par défaut",
    settings: DEFAULT_SETTINGS
  });
}

async function exportSettings() {
  // Créer un log d'audit
  await prisma.auditLog.create({
    data: {
      action: "SETTINGS_EXPORT",
      performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
      details: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    }
  });

  return NextResponse.json({
    message: "Paramètres exportés avec succès",
    settings: DEFAULT_SETTINGS,
    exportDate: new Date().toISOString()
  });
}

async function validateSettings(settings: any) {
  const validationErrors: string[] = [];

  // Validation des paramètres métier
  if (settings.business) {
    if (settings.business.defaultTva < 0 || settings.business.defaultTva > 1) {
      validationErrors.push("Le taux de TVA doit être entre 0 et 1");
    }
    if (settings.business.minOrderAmount < 0) {
      validationErrors.push("Le montant minimum de commande ne peut pas être négatif");
    }
    if (settings.business.maxOrderAmount <= settings.business.minOrderAmount) {
      validationErrors.push("Le montant maximum de commande doit être supérieur au minimum");
    }
  }

  // Validation des paramètres de stock
  if (settings.stock) {
    if (settings.stock.defaultMinStock < 0) {
      validationErrors.push("Le stock minimum ne peut pas être négatif");
    }
    if (settings.stock.defaultMaxStock <= settings.stock.defaultMinStock) {
      validationErrors.push("Le stock maximum doit être supérieur au minimum");
    }
  }

  // Validation des paramètres de prix
  if (settings.pricing) {
    const totalRates = (settings.pricing.authorRoyaltyRate || 0) +
                      (settings.pricing.conceptorRoyaltyRate || 0) +
                      (settings.pricing.partnerCommissionRate || 0) +
                      (settings.pricing.representantCommissionRate || 0);

    if (totalRates > 0.5) {
      validationErrors.push("Le total des taux de commission ne peut pas dépasser 50%");
    }
  }

  // Validation des paramètres de sécurité
  if (settings.security) {
    if (settings.security.passwordMinLength < 6) {
      validationErrors.push("La longueur minimale du mot de passe doit être d'au moins 6 caractères");
    }
    if (settings.security.sessionTimeout < 30) {
      validationErrors.push("Le timeout de session doit être d'au moins 30 minutes");
    }
  }

  return NextResponse.json({
    valid: validationErrors.length === 0,
    errors: validationErrors,
    message: validationErrors.length === 0 ? "Paramètres valides" : "Paramètres invalides"
  });
}



