$files = @(
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\works\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\users\validate\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\users\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\users\profile\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\settings\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\pdg\notifications-templates\broadcast\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\pdg\classes\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\pdg\parametres\avance\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\pdg\matieres\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\pdg\code-promo\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\projects\[id]\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\pdg\categories\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\projects\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\partners\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\messages\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\disciplines\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\concepteurs\projects\route.ts",
    "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api\authors\works\route.ts"
)

$totalFiles = 0
$totalChanges = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Pattern to find: await prisma.auditLog.create({ ... })
        # We'll replace with commented version
        $pattern = '(\s*)(await\s+(?:prisma|tx)\.auditLog\.create\s*\(\s*\{)'
        
        # Count matches before replacement
        $matches = [regex]::Matches($content, $pattern)
        
        if ($matches.Count -gt 0) {
            # Add comment before each occurrence
            $content = [regex]::Replace($content, $pattern, '$1// AUDITLOG DÉSACTIVÉ - $2')
            
            # Comment out the actual lines (this is a simplified approach)
            # For a more robust solution, we'd need to parse the entire block
            
            Set-Content -Path $file -Value $content -NoNewline
            
            $totalFiles++
            $totalChanges += $matches.Count
            Write-Host "  ✓ Modified $($matches.Count) occurrence(s)" -ForegroundColor Green
        } else {
            Write-Host "  - No auditLog.create found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Summary:" -ForegroundColor Magenta
Write-Host "  Files modified: $totalFiles" -ForegroundColor Green
Write-Host "  Total changes: $totalChanges" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Magenta
