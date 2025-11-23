const fs = require('fs');
const path = require('path');

// Liste des pages PDG qui utilisent DashboardLayout
const pdgPages = [
  'app/dashboard/pdg/livres/collections/page.tsx',
  'app/dashboard/pdg/ventes-retours/page.tsx',
  'app/dashboard/pdg/suivi-rapport/page.tsx',
  'app/dashboard/pdg/stock/niveau/page.tsx',
  'app/dashboard/pdg/stock/demande/page.tsx',
  'app/dashboard/pdg/ristournes/partenaire/page.tsx',
  'app/dashboard/pdg/proforma/page.tsx',
  'app/dashboard/pdg/ristournes/droit-auteur/page.tsx',
  'app/dashboard/pdg/profil/page.tsx',
  'app/dashboard/pdg/parametres/zones/page.tsx',
  'app/dashboard/pdg/parametres/utilisateurs/page.tsx',
  'app/dashboard/pdg/parametres/reductions/page.tsx',
  'app/dashboard/pdg/parametres/logs/page.tsx',
  'app/dashboard/pdg/parametres/effectifs/page.tsx',
  'app/dashboard/pdg/parametres/departements/page.tsx',
  'app/dashboard/pdg/parametres/avance/page.tsx',
  'app/dashboard/pdg/notifications/liste/page.tsx',
  'app/dashboard/pdg/notifications/diffusion/page.tsx',
  'app/dashboard/pdg/notifications/chaine/page.tsx',
  'app/dashboard/pdg/livres/matieres/page.tsx',
  'app/dashboard/pdg/livres/code-promo/page.tsx',
  'app/dashboard/pdg/livres/classes/page.tsx',
  'app/dashboard/pdg/livres/categories/page.tsx',
  'app/dashboard/pdg/commandes/page.tsx',
  'app/dashboard/pdg/clients/page.tsx',
  'app/dashboard/pdg/bon-sortie/page.tsx'
];

function getPageTitle(filePath) {
  // Extraire le titre de la page basé sur le chemin
  const pathParts = filePath.split('/');
  const fileName = pathParts[pathParts.length - 2]; // Nom du dossier parent
  
  const titleMap = {
    'collections': 'Collections',
    'ventes-retours': 'Ventes & retours',
    'suivi-rapport': 'Suivi et rapport',
    'niveau': 'Niveau de stock',
    'demande': 'Demande stock',
    'partenaire': 'Ristournes Partenaire',
    'proforma': 'Proforma',
    'droit-auteur': 'Droits d\'auteur',
    'profil': 'Mon profil',
    'zones': 'Zones',
    'utilisateurs': 'Utilisateurs',
    'reductions': 'Réductions',
    'logs': 'Logs',
    'effectifs': 'Effectifs',
    'departements': 'Départements',
    'avance': 'Avancé',
    'liste': 'Notifications',
    'diffusion': 'Diffusion',
    'chaine': 'Chaîne',
    'matieres': 'Matières',
    'code-promo': 'Code Promo',
    'classes': 'Classes',
    'categories': 'Catégories',
    'commandes': 'Les commandes',
    'clients': 'Clients',
    'bon-sortie': 'Bon de sortie'
  };
  
  return titleMap[fileName] || fileName;
}

function getBreadcrumb(filePath) {
  const title = getPageTitle(filePath);
  return `Tableau de bord - ${title}`;
}

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

    // 2. Extraire le titre et le breadcrumb
    const title = getPageTitle(filePath);
    const breadcrumb = getBreadcrumb(filePath);

    // 3. Remplacer DashboardLayout par DynamicDashboardLayout avec les bonnes props
    const dashboardLayoutRegex = /<DashboardLayout\s+([^>]*)>/g;
    if (dashboardLayoutRegex.test(content)) {
      content = content.replace(dashboardLayoutRegex, (match, props) => {
        // Si onRefresh est présent, on le garde
        if (props.includes('onRefresh')) {
          return `<DynamicDashboardLayout title="${title}" breadcrumb="${breadcrumb}" onRefresh={handleRefresh}>`;
        } else {
          return `<DynamicDashboardLayout title="${title}" breadcrumb="${breadcrumb}">`;
        }
      });
      modified = true;
    }

    // 4. Supprimer le header dupliqué (div avec bg-slate-700) mais garder le contenu utile
    // On supprime seulement la div wrapper, pas le contenu à l'intérieur
    const headerPattern = /<div className="bg-slate-700[^"]*"[^>]*>\s*<div[^>]*>\s*<div[^>]*>\s*<h2[^>]*>[^<]+<\/h2>\s*<\/div>\s*<div[^>]*>\s*<span[^>]*>[^<]+<\/span>\s*<\/div>\s*<\/div>\s*<\/div>/;
    if (headerPattern.test(content)) {
      content = content.replace(headerPattern, '');
      modified = true;
    }

    // 5. Remplacer </DashboardLayout> par </DynamicDashboardLayout>
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

console.log('🔧 Starting to fix all PDG pages safely...\n');

let fixedCount = 0;
pdgPages.forEach(page => {
  if (fixPage(page)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} out of ${pdgPages.length} pages`);
console.log('✅ All PDG pages should now use DynamicDashboardLayout');

