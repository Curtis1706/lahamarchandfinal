const fs = require('fs');
const path = require('path');

// Liste des pages PDG qui utilisent DashboardLayout
const pdgPages = [
  'app/dashboard/pdg/stock/niveau/page.tsx',
  'app/dashboard/pdg/ristournes/droit-auteur/page.tsx',
  'app/dashboard/pdg/proforma/page.tsx',
  'app/dashboard/pdg/profil/page.tsx',
  'app/dashboard/pdg/commandes/page.tsx',
  'app/dashboard/pdg/clients/page.tsx',
  'app/dashboard/pdg/ventes-retours/page.tsx',
  'app/dashboard/pdg/suivi-rapport/page.tsx',
  'app/dashboard/pdg/stock/demande/page.tsx',
  'app/dashboard/pdg/ristournes/partenaire/page.tsx',
  'app/dashboard/pdg/parametres/zones/page.tsx',
  'app/dashboard/pdg/parametres/utilisateurs/page.tsx',
  'app/dashboard/pdg/parametres/remises/page.tsx',
  'app/dashboard/pdg/parametres/logs/page.tsx',
  'app/dashboard/pdg/parametres/effectifs/page.tsx',
  'app/dashboard/pdg/parametres/departements/page.tsx',
  'app/dashboard/pdg/parametres/avance/page.tsx',
  'app/dashboard/pdg/notifications/liste/page.tsx',
  'app/dashboard/pdg/notifications/chaine/page.tsx',
  'app/dashboard/pdg/livres/matieres/page.tsx',
  'app/dashboard/pdg/notifications/diffusion/page.tsx',
  'app/dashboard/pdg/livres/collections/page.tsx',
  'app/dashboard/pdg/livres/code-promo/page.tsx',
  'app/dashboard/pdg/livres/classes/page.tsx',
  'app/dashboard/pdg/livres/categories/page.tsx',
  'app/dashboard/pdg/bon-sortie/page.tsx'
];

function fixPage(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Remplacer l'import DashboardLayout par DynamicDashboardLayout
    if (content.includes('import DashboardLayout from "@/components/dashboard-layout"')) {
      content = content.replace(
        'import DashboardLayout from "@/components/dashboard-layout"',
        'import DynamicDashboardLayout from "@/components/dynamic-dashboard-layout"'
      );
      modified = true;
    }

    // 2. Remplacer <DashboardLayout title=""> par <DynamicDashboardLayout title="..." breadcrumb="...">
    // D'abord, extraire le titre depuis le header
    const titleMatch = content.match(/<h2[^>]*>([^<]+)<\/h2>/);
    const breadcrumbMatch = content.match(/<span[^>]*>([^<]+)<\/span>/);
    
    let title = "Page";
    let breadcrumb = "Tableau de bord";
    
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    if (breadcrumbMatch && breadcrumbMatch[1].includes("Tableau de bord")) {
      breadcrumb = breadcrumbMatch[1].trim();
    }

    // Remplacer DashboardLayout
    if (content.includes('<DashboardLayout title="">')) {
      content = content.replace(
        '<DashboardLayout title="">',
        `<DynamicDashboardLayout title="${title}" breadcrumb="${breadcrumb}">`
      );
      modified = true;
    } else if (content.includes('<DashboardLayout title=\'\'>')) {
      content = content.replace(
        '<DashboardLayout title=\'\'>',
        `<DynamicDashboardLayout title="${title}" breadcrumb="${breadcrumb}">`
      );
      modified = true;
    }

    // 3. Supprimer le header dupliqué (div avec bg-slate-700)
    const headerPattern = /<div className="bg-slate-700[^"]*"[^>]*>[\s\S]*?<\/div>/;
    if (headerPattern.test(content)) {
      content = content.replace(headerPattern, '');
      modified = true;
    }

    // 4. Remplacer </DashboardLayout> par </DynamicDashboardLayout>
    if (content.includes('</DashboardLayout>')) {
      content = content.replace('</DashboardLayout>', '</DynamicDashboardLayout>');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Starting to fix all PDG pages...\n');

let fixedCount = 0;
pdgPages.forEach(page => {
  if (fixPage(page)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} out of ${pdgPages.length} pages`);
console.log('✅ All PDG pages should now use DynamicDashboardLayout');

