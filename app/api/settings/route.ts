import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RebateRateType } from "@prisma/client";

// Paramètres par défaut
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
    authorRoyaltyRate: 0.15, // 15% pour les auteurs (par défaut)
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

// Fonction pour convertir une valeur de chaîne selon son type
function convertValue(value: string, type: string) {
  switch (type) {
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value === 'true';
    case 'json':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

// Fonction pour récupérer tous les paramètres depuis la base
async function getAllSettingsFromDB() {
  try {
    const dbSettings = await prisma.advancedSetting.findMany();

    // Initialiser avec les valeurs par défaut (clone profond pour éviter les mutations)
    const settings: any = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    dbSettings.forEach(setting => {
      if (!setting.category) return;

      const category = setting.category;
      const key = setting.key.split('.').pop(); // Récupérer la partie après le point

      if (key && settings[category]) {
        settings[category][key] = convertValue(setting.value, setting.type);
      }
    });

    return settings;
  } catch (error) {
    logger.error("Error fetching all settings from DB:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const settings = await getAllSettingsFromDB();

    if (category && settings[category]) {
      return NextResponse.json({
        category,
        settings: settings[category]
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json({ settings }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logger.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres" },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PDG") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { category, settings } = body;

    if (!category || !settings) {
      return NextResponse.json({ error: "Catégorie et paramètres requis" }, { status: 400 });
    }

    // Sauvegarde générique dans AdvancedSetting
    for (const [key, value] of Object.entries(settings)) {
      const fullKey = `${category}.${key}`;
      const type = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';

      await prisma.advancedSetting.upsert({
        where: { key: fullKey },
        update: {
          value: value!.toString(),
          type,
          category,
          updatedById: session.user.id
        },
        create: {
          key: fullKey,
          description: `Réglage ${key} de la catégorie ${category}`,
          value: value!.toString(),
          type,
          category,
          status: 'Actif',
          updatedById: session.user.id
        }
      });
    }

    // Garder la logique spécifique pour le pricing (RebateRate)
    if (category === "pricing") {
      await savePricingToRebateRates(settings, session.user.id);
    }

    return NextResponse.json({
      message: "Paramètres mis à jour avec succès",
      category,
      settings
    });
  } catch (error) {
    logger.error("Error updating settings:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

// Séparation de la logique spécifique Pricing
async function savePricingToRebateRates(pricing: any, userId: string) {
  // Désactiver les anciens taux GLOBAL
  await prisma.rebateRate.updateMany({
    where: { type: "GLOBAL", isActive: true },
    data: { isActive: false }
  });

  // Créer/Mettre à jour le taux GLOBAL actuel (basé sur authorRoyaltyRate)
  const rateValue = (pricing.authorRoyaltyRate || 0.15) * 100;

  await prisma.rebateRate.upsert({
    where: { type_partnerId_userId_workId: { type: "GLOBAL", partnerId: null, userId: null, workId: null } },
    update: { rate: rateValue, isActive: true, updatedAt: new Date() },
    create: { type: "GLOBAL", rate: rateValue, isActive: true, createdById: userId }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "reset_to_defaults":
        // Optionnel : on pourrait vider la table AdvancedSetting
        return NextResponse.json({ message: "Réinitialisé", settings: DEFAULT_SETTINGS });
      case "export_settings":
        const currentSettings = await getAllSettingsFromDB();
        return NextResponse.json({ settings: currentSettings, exportDate: new Date().toISOString() });
      case "validate_settings":
        return await validateSettings(body.settings);
      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

async function validateSettings(settings: any) {
  const validationErrors: string[] = [];
  if (settings.business) {
    if (settings.business.defaultTva < 0 || settings.business.defaultTva > 1) validationErrors.push("TVA invalide");
  }
  return NextResponse.json({
    valid: validationErrors.length === 0,
    errors: validationErrors,
    message: validationErrors.length === 0 ? "Valide" : "Invalide"
  });
}

