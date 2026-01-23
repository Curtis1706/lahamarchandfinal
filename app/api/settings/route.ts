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

// Fonction pour récupérer les taux de pricing depuis la base
async function getPricingRatesFromDB() {
  try {
    const pricingKeys = [
      'pricing.authorRoyaltyRate',
      'pricing.conceptorRoyaltyRate',
      'pricing.partnerCommissionRate',
      'pricing.representantCommissionRate'
    ];

    // Vérifier que Prisma est disponible
    if (!prisma) {
      logger.warn("Prisma client not available, using default pricing rates");
      return DEFAULT_SETTINGS.pricing;
    }

    const settings = await prisma.advancedSetting.findMany({
      where: {
        key: { in: pricingKeys }
      }
    }).catch((error) => {
      logger.error("Prisma error fetching pricing rates:", error);
      return [];
    });

    const pricing: any = { ...DEFAULT_SETTINGS.pricing };

    settings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value)) {
        if (setting.key === 'pricing.authorRoyaltyRate') {
          pricing.authorRoyaltyRate = value;
        } else if (setting.key === 'pricing.conceptorRoyaltyRate') {
          pricing.conceptorRoyaltyRate = value;
        } else if (setting.key === 'pricing.partnerCommissionRate') {
          pricing.partnerCommissionRate = value;
        } else if (setting.key === 'pricing.representantCommissionRate') {
          pricing.representantCommissionRate = value;
        }
      }
    });

    return pricing;
  } catch (error: any) {
    logger.error("Error fetching pricing rates from DB:", error?.message || error);
    // Toujours retourner les valeurs par défaut en cas d'erreur
    return DEFAULT_SETTINGS.pricing;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Récupérer les paramètres de pricing depuis la base de données
    // En cas d'erreur, utiliser les valeurs par défaut
    let pricingRates = DEFAULT_SETTINGS.pricing;
    try {
      pricingRates = await getPricingRatesFromDB();
    } catch (pricingError) {
      logger.error("Error fetching pricing rates from DB, using defaults:", pricingError);
      // Continuer avec les valeurs par défaut
    }

    const settings = {
      ...DEFAULT_SETTINGS,
      pricing: pricingRates
    };

    if (category && settings[category as keyof typeof settings]) {
      return NextResponse.json({
        category,
        settings: settings[category as keyof typeof settings]
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return NextResponse.json({
      settings
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    logger.error("Error fetching settings:", error);
    // Toujours retourner du JSON, même en cas d'erreur
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des paramètres",
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== "PDG") {
      return NextResponse.json(
        { error: "Accès refusé - Seul le PDG peut modifier les paramètres" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, settings } = body;

    if (!category || !settings) {
      return NextResponse.json(
        { error: "Catégorie et paramètres requis" },
        { status: 400 }
      );
    }

    logger.debug(`Updating settings for category: ${category}`, settings);

    // Si c'est la catégorie pricing, sauvegarder dans AdvancedSetting et RebateRate
    if (category === "pricing") {
      await savePricingSettings(settings, session.user.id);
    }

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `SETTINGS_UPDATE_${category.toUpperCase()}`,
        performedBy: session.user.name || session.user.email || "PDG",
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
    logger.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres" },
      { status: 500 }
    );
  }
}

// Fonction pour sauvegarder les paramètres de pricing
async function savePricingSettings(pricing: any, userId: string) {
  try {
    // Sauvegarder dans AdvancedSetting pour la persistance
    const pricingSettings = [
      { key: 'pricing.authorRoyaltyRate', description: 'Taux de royalties pour les auteurs', value: pricing.authorRoyaltyRate.toString() },
      { key: 'pricing.conceptorRoyaltyRate', description: 'Taux de royalties pour les concepteurs', value: pricing.conceptorRoyaltyRate.toString() },
      { key: 'pricing.partnerCommissionRate', description: 'Taux de commission pour les partenaires', value: pricing.partnerCommissionRate.toString() },
      { key: 'pricing.representantCommissionRate', description: 'Taux de commission pour les représentants', value: pricing.representantCommissionRate.toString() }
    ];

    for (const setting of pricingSettings) {
      await prisma.advancedSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          updatedById: userId,
          updatedAt: new Date()
        },
        create: {
          key: setting.key,
          description: setting.description,
          value: setting.value,
          type: 'number',
          category: 'pricing',
          updatedById: userId
        }
      });
    }

    // Désactiver les anciens taux GLOBAL dans RebateRate
    await prisma.rebateRate.updateMany({
      where: {
        type: "GLOBAL",
        isActive: true,
        partnerId: null,
        userId: null,
        workId: null
      },
      data: {
        isActive: false
      }
    });

    // Créer de nouveaux taux GLOBAL dans RebateRate pour utilisation par le système
    // Note: On crée un seul taux GLOBAL pour les auteurs (le système utilisera celui-ci)
    // Les autres types (PARTNER, etc.) seront gérés séparément
    const authorRate = await prisma.rebateRate.findFirst({
      where: {
        type: "GLOBAL",
        userId: null,
        workId: null,
        partnerId: null
      }
    });

    if (authorRate) {
      await prisma.rebateRate.update({
        where: { id: authorRate.id },
        data: {
          rate: pricing.authorRoyaltyRate * 100, // Convertir en pourcentage
          isActive: true,
          updatedAt: new Date()
        }
      });
    } else {
      // Créer un nouveau taux GLOBAL pour les auteurs
      await prisma.rebateRate.create({
        data: {
          type: "GLOBAL",
          rate: pricing.authorRoyaltyRate * 100,
          isActive: true,
          createdById: userId
        }
      });
    }

    logger.debug("✅ Pricing settings saved successfully");
  } catch (error) {
    logger.error("Error saving pricing settings:", error);
    throw error;
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
    logger.error("Error in settings action:", error);
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




