-- Migration pour ajouter le champ disciplineId à la table User
-- et créer la relation avec Discipline

-- Ajouter la colonne disciplineId à la table User
ALTER TABLE "User" ADD COLUMN "disciplineId" TEXT;

-- Créer un index pour la clé étrangère
CREATE INDEX "User_disciplineId_idx" ON "User"("disciplineId");

-- Ajouter la contrainte de clé étrangère
-- Note: SQLite ne supporte pas ALTER TABLE ADD CONSTRAINT, 
-- donc nous devons recréer la table avec la contrainte

-- Sauvegarder les données existantes
CREATE TABLE "User_backup" AS SELECT * FROM "User";

-- Supprimer l'ancienne table
DROP TABLE "User";

-- Recréer la table User avec la nouvelle structure
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "disciplineId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Restaurer les données
INSERT INTO "User" SELECT * FROM "User_backup";

-- Supprimer la table de sauvegarde
DROP TABLE "User_backup";

-- Créer l'index pour la clé étrangère
CREATE INDEX "User_disciplineId_idx" ON "User"("disciplineId");


