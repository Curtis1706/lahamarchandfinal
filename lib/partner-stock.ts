/**
 * Helper pour calculer et gérer le stock partenaire
 * 
 * Formule: available = allocatedQuantity - soldQuantity + returnedQuantity
 */

import { Work, Partner } from '@prisma/client';

/**
 * Calcule le stock disponible d'un PartnerStock
 * 
 * @param allocatedQuantity - Quantité allouée par le PDG
 * @param soldQuantity - Quantité vendue
 * @param returnedQuantity - Quantité retournée
 * @returns Stock disponible
 */
export function calculateAvailableStock(
  allocatedQuantity: number,
  soldQuantity: number,
  returnedQuantity: number
): number {
  return allocatedQuantity - soldQuantity + returnedQuantity;
}

/**
 * Type helper pour PartnerStock avec available calculé
 */
export interface PartnerStockWithAvailable {
  id: string;
  partnerId: string;
  workId: string;
  allocatedQuantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  availableQuantity: number; // Calculé, pas stocké en DB
  createdAt: Date;
  updatedAt: Date;
  work?: Pick<Work, 'id' | 'title' | 'price' | 'isbn'>;
  partner?: Pick<Partner, 'id' | 'name' | 'type'>;
}

/**
 * Enrichit un PartnerStock avec availableQuantity calculé
 * 
 * @param stock - PartnerStock de Prisma
 * @returns PartnerStock avec availableQuantity calculé
 */
export function enrichPartnerStockWithAvailable(
  stock: {
    id: string;
    partnerId: string;
    workId: string;
    allocatedQuantity: number;
    soldQuantity: number;
    returnedQuantity: number;
    createdAt: Date;
    updatedAt: Date;
    work?: Pick<Work, 'id' | 'title' | 'price' | 'isbn'>;
    partner?: Pick<Partner, 'id' | 'name' | 'type'>;
  }
): PartnerStockWithAvailable {
  return {
    ...stock,
    availableQuantity: calculateAvailableStock(
      stock.allocatedQuantity,
      stock.soldQuantity,
      stock.returnedQuantity
    )
  };
}

/**
 * Vérifie si un PartnerStock a assez de stock disponible
 * 
 * @param stock - PartnerStock
 * @param requestedQuantity - Quantité demandée
 * @returns true si disponible >= demandé
 */
export function hasEnoughStock(
  stock: {
    allocatedQuantity: number;
    soldQuantity: number;
    returnedQuantity: number;
  },
  requestedQuantity: number
): boolean {
  const available = calculateAvailableStock(
    stock.allocatedQuantity,
    stock.soldQuantity,
    stock.returnedQuantity
  );
  return available >= requestedQuantity;
}





