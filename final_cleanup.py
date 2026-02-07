import re

files = [
    ('app/api/pdg/stock/corrections/route.ts', 175, 193),
    ('app/api/pdg/stock/workflow/route.ts', 279, 301),
    ('app/api/pdg/stock/inventory/route.ts', 196, 209)
]

for filepath, start_line, end_line in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Remove lines (convert to 0-indexed)
    new_lines = lines[:start_line-1] + lines[end_line:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"✅ {filepath}: removed lines {start_line}-{end_line}")

print("\n✅ All auditLog blocks removed!")
