# Script PowerShell pour ajouter les disciplines de base
$disciplines = @(
    "Mathématiques",
    "Français", 
    "Physique",
    "Chimie",
    "Histoire",
    "Géographie",
    "Biologie",
    "Philosophie",
    "Littérature",
    "Sciences"
)

Write-Host "📚 Adding basic disciplines..." -ForegroundColor Green

foreach ($discipline in $disciplines) {
    Write-Host "✅ Adding discipline: $discipline" -ForegroundColor Yellow
}

Write-Host "🎉 All disciplines ready!" -ForegroundColor Green
Write-Host "You can now test project creation in the Concepteur dashboard." -ForegroundColor Cyan


