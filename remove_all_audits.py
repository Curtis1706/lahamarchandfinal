import re

def remove_auditlog_from_file(filepath):
    """Remove all auditLog.create blocks from a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern pour attraper les blocs auditLog complets avec await
        # Cherche depuis "await" jusqu'à la fermeture du create()
        pattern = r'await\s+(?:prisma|tx)\.auditLog\.create\s*\(\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*\)'
        
        # Supprimer les appels
        content = re.sub(pattern, '// AuditLog supprimé', content, flags=re.DOTALL)
        
        # Nettoyer les lignes vides en trop
        content = re.sub(r'\n{3,}', '\n\n', content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ Error in {filepath}: {e}")
        return False

# Liste des fichiers à traiter
files = [
    'app/api/works/route.ts',
    'app/api/settings/route.ts',
    'app/api/users/route.ts',
    'app/api/users/profile/route.ts',
    'app/api/users/validate/route.ts',
    'app/api/partners/route.ts',
    'app/api/pdg/classes/route.ts',
    'app/api/pdg/notifications-templates/broadcast/route.ts',
    'app/api/pdg/parametres/avance/route.ts',
    'app/api/pdg/categories/route.ts',
    'app/api/projects/[id]/route.ts',
    'app/api/pdg/matieres/route.ts',
    'app/api/pdg/code-promo/route.ts',
    'app/api/projects/route.ts',
    'app/api/disciplines/route.ts',
    'app/api/messages/route.ts',
    'app/api/concepteurs/projects/route.ts',
    'app/api/authors/works/route.ts'
]

modified = 0
for filepath in files:
    if remove_auditlog_from_file(filepath):
        print(f"✅ {filepath}")
        modified += 1

print(f"\n✅ Modified {modified} files")
