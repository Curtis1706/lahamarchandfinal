import re
from pathlib import Path

files = [
    'app/api/projects/[id]/route.ts',
    'app/api/pdg/matieres/route.ts',
    'app/api/pdg/categories/route.ts',
    'app/api/pdg/classes/route.ts',
    'app/api/messages/route.ts',
    'app/api/disciplines/route.ts'
]

def remove_auditlog_completely(filepath):
    """Remove all auditLog.create blocks using line-by-line approach"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        result = []
        skip_mode = False
        brace_count = 0
        
        for i, line in enumerate(lines):
            #Check if this line starts an auditLog block
            if 'auditLog.create' in line:
                skip_mode = True
                brace_count = line.count('{') - line.count('}')
                continue
            
            if skip_mode:
                brace_count += line.count('{') -line.count('}')
                if brace_count <= 0 and (');' in line or ')' in line):
                    skip_mode = False
                continue
            
            result.append(line)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(result)
        
        print(f"✅ {filepath}")
        return True
    except Exception as e:
        print(f"❌ {filepath}: {e}")
        return False

modified = 0
for file in files:
    if remove_auditlog_completely(file):
        modified += 1

print(f"\n✅ Modified {modified} files")
