-- Script SQL pour créer un utilisateur concepteur et vérifier les données
INSERT OR IGNORE INTO User (id, name, email, role, emailVerified, createdAt, updatedAt) VALUES 
('concepteur-1', 'Concepteur Test', 'concepteur@test.com', 'CONCEPTEUR', datetime('now'), datetime('now'), datetime('now'));

-- Vérifier les utilisateurs
SELECT id, name, email, role FROM User;

-- Vérifier les projets
SELECT p.id, p.title, p.status, u.name as concepteur_name, d.name as discipline_name 
FROM Project p 
LEFT JOIN User u ON p.concepteurId = u.id 
LEFT JOIN Discipline d ON p.disciplineId = d.id;


