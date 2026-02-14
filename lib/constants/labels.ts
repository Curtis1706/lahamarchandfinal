export const CLIENT_TYPES = {
    INDIVIDUAL: 'particulier',
    BOUTIQUE: 'boutique',
    WHOLESALER: 'grossiste',
    ECOLE_CONTRACTUELLE: 'ecole_contractuelle',
    ECOLE_NON_CONTRACTUELLE: 'ecole_non_contractuelle',
    PARTNER: 'partenaire',
    LIBRARY: 'bibliotheque',
} as const;

export const CLIENT_TYPE_LABELS = {
    [CLIENT_TYPES.INDIVIDUAL]: 'Particulier',
    [CLIENT_TYPES.BOUTIQUE]: 'Boutique',
    [CLIENT_TYPES.WHOLESALER]: 'Grossiste',
    [CLIENT_TYPES.ECOLE_CONTRACTUELLE]: 'École Contractuelle',
    [CLIENT_TYPES.ECOLE_NON_CONTRACTUELLE]: 'École Non Contractuelle',
    [CLIENT_TYPES.PARTNER]: 'Partenaire',
    [CLIENT_TYPES.LIBRARY]: 'Bibliothèque',
};

export const ROYALTY_TYPES = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;

export const ROYALTY_TYPE_LABELS = {
    [ROYALTY_TYPES.PERCENTAGE]: 'Pourcentage',
    [ROYALTY_TYPES.FIXED_AMOUNT]: 'Montant Fixe',
};
