# Script pour commenter tous les appels await prisma.auditLog.create({
# simple et rapide

$rootPath = "c:\Users\JoyBoy\Desktop\Projets\lahamarchandfinal\app\api"
$filesModified = 0
$totalOccurrences = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Désactivation des appels AuditLog.create" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Get-ChildItem -Path $rootPath -Filter "*.ts" -Recurse | ForEach-Object {
    $file = $_
    $filepath = $file.FullName
    $content = Get-Content $filepath -Raw -ErrorAction SilentlyContinue
    
    if ($null -eq $content) {
        return
    }
    
    # Compter les occurrences avant modification
    $beforeCount = ([regex]::Matches($content, 'await\s+(?:prisma|tx)\.auditLog\.create\s*\(')).Count
    
    if ($beforeCount -gt 0) {
        # Remplacer await prisma.auditLog.create( par // AUDITLOG DÉSACTIVÉ - await prisma.auditLog.create(
        $newContent = $content -replace '(\s*)(await\s+(?:prisma|tx)\.auditLog\.create\s*\()', '$1// AUDITLOG DÉSACTIVÉ - $2'
        
        # Compter après remplacement
        $afterCount = ([regex]::Matches($newContent, '// AUDITLOG DÉSACTIVÉ - await\s+(?:prisma|tx)\.auditLog\.create\s*\(')).Count
        
        if ($afterCount -eq $beforeCount) {
            $relativePath = $file.FullName.Replace($rootPath, '').TrimStart('\')
            Write-Host "✓ $relativePath" -ForegroundColor Green
            Write-Host "  Occurrences désactivées: $beforeCount" -ForegroundColor Gray
            
            Set-Content -Path $filepath -Value $newContent -NoNewline -Encoding UTF8
            $filesModified++
            $totalOccurrences += $beforeCount
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Résumé:" -ForegroundColor Magenta
Write-Host "  Fichiers modifiés: $filesModified" -ForegroundColor Green
Write-Host "  Total occurrences: $totalOccurrences" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Magenta

Write-Host "Note: Ce script a juste commenté la ligne 'await ...auditLog.create'." -ForegroundColor Yellow
Write-Host "Certaines fermetures de blocs try/catch pourraient avoir besoin d'ajustements manuels." -ForegroundColor Yellow
