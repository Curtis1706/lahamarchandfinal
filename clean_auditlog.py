import os
import re
from pathlib import Path

def remove_auditlog_simple(filepath):
    """Remove auditLog lines by finding and removing entire call blocks"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        result_lines = []
        skip_until = -1
        removed_blocks = 0
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            # Skip if we're in a block to remove
            if i < skip_until:
                i += 1
                continue
            
            # Check if this line contains auditLog.create
            if 'auditLog.create' in line:
                # Find the start (look backward for comment or try)
                start_idx = i
                for j in range(i-1, max(0, i-5), -1):
                    if 'audit' in lines[j].lower() or 'try' in lines[j]:
                        start_idx = j
                        break
                
                # Find the end (look for closing braces)
                brace_count = 0
                end_idx = i
                started_counting = False
                
                for j in range(i, min(len(lines), i+50)):
                    if '.create(' in lines[j]:
                        started_counting = True
                    if started_counting:
                        brace_count += lines[j].count('{')
                        brace_count -= lines[j].count('}')
                        if brace_count <= 0 and ');' in lines[j]:
                            end_idx = j
                            # Check for catch block
                            if j+1 < len(lines) and 'catch' in lines[j+1]:
                                for k in range(j+1, min(len(lines), j+10)):
                                    if '}' in lines[k]:
                                        end_idx = k
                                        break
                            break
                
                # Skip this block
                skip_until = end_idx + 1
                removed_blocks += 1
                i = end_idx + 1
                continue
            
            result_lines.append(line)
            i += 1
        
        if removed_blocks > 0:
            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(result_lines)
            print(f"✅ {filepath.name}: removed {removed_blocks} blocks")
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ {filepath.name}: {str(e)}")
    return False

def main():
    api_dir = Path('app/api')
    
    if not api_dir.exists():
        print("❌ app/api not found!")
        return
    
    ts_files = list(api_dir.rglob('*.ts'))
    total_modified = 0
    
    print(f"\n🔍 Processing {len(ts_files)} files...\n")
    
    for filepath in ts_files:
        if remove_auditlog_simple(filepath):
            total_modified += 1
    
    print(f"\n✅ Modified {total_modified} files\n")

if __name__ == '__main__':
    main()
