import os
import re
from pathlib import Path

def remove_auditlog_blocks(content):
    """Remove all auditLog.create blocks from content"""
    
    # Pattern 1: Try-catch blocks containing ONLY auditLog
    pattern1 = r'\/\/[^\n]*(?:[Cc]réer|[Cc]reate).*?(?:audit|log d\'audit)[^\n]*\n\s*try\s*\{[^}]*?await\s+(?:prisma|tx)\.auditLog\.create\s*\([^;]*?\);?\s*[^}]*?\}\s*catch\s*\([^)]*\)\s*\{[^}]*?\}\s*'
    
    # Pattern 2: Standalone auditLog with comment
    pattern2 = r'\/\/[^\n]*(?:[Cc]réer|[Cc]reate).*?(?:audit|log d\'audit)[^\n]*\n\s*(?:\/\*\s*)?await\s+(?:prisma|tx)\.auditLog\.create\s*\([^;]*?\);?\s*(?:\*\/)?'
    
    # Remove try-catch blocks first
    modified = re.sub(pattern1, '\n', content, flags=re.DOTALL)
    
    # Then remove standalone calls
    modified = re.sub(pattern2, '\n', modified, flags=re.DOTALL)
    
    # Clean up excessive blank lines
    modified = re.sub(r'\n{3,}', '\n\n', modified)
    
    return modified

def process_file(filepath):
    """Process a single TypeScript file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has auditLog references
        if 'auditLog.create' not in content:
            return False
        
        original_count = content.count('auditLog.create')
        modified = remove_auditlog_blocks(content)
        new_count = modified.count('auditLog.create')
        
        if new_count < original_count:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(modified)
            removed = original_count - new_count
            print(f"✅ {filepath.relative_to(Path.cwd())}: removed {removed} auditLog blocks")
            return True
        
        return False
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    """Main function to process all TypeScript files in app/api"""
    api_dir = Path('app/api')
    
    if not api_dir.exists():
        print("❌ Directory app/api not found!")
        return
    
    ts_files = list(api_dir.rglob('*.ts'))
    total_files = 0
    
    print(f"\n🔍 Found {len(ts_files)} TypeScript files in app/api\n")
    
    for filepath in ts_files:
        if process_file(filepath):
            total_files += 1
    
    print(f"\n✅ Total: {total_files} files modified\n")

if __name__ == '__main__':
    main()
