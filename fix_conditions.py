import re

filepath = 'app/dashboard/pdg/gestion-stock/page.tsx'

# Read the file
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the problematic line 1132
old_pattern = r'const conditions = typeof rule\.conditions === \'string\' \? JSON\.parse\(rule\.conditions\) : rule\.conditions'
new_pattern = '''let conditions: any = {}
                      try {
                        conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : (rule.conditions || {})
                      } catch (e) {
                        console.error('Failed to parse conditions', e)
                      }'''

content = re.sub(old_pattern, new_pattern, content)

# Add null checks for conditions
content = content.replace(
    '{conditions.minStock &&',
    '{conditions && conditions.minStock &&'
)
content = content.replace(
    '{conditions.maxStock &&',  
    '{conditions && conditions.maxStock &&'
)

# Write back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed conditions null safety in gestion-stock/page.tsx")
