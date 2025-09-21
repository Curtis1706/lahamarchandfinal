export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Politique de Confidentialité</h1>
        <button className="text-gray-300 hover:text-white text-sm">Tableau de bord</button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 bg-white mt-6 rounded-lg shadow-sm">
        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              La présente politique de confidentialité décrit comment LAHA EDITIONS Sarl collecte, utilise, protège et
              partage les informations personnelles des utilisateurs de notre plateforme et des services associés,
              notamment le projet LAHA MARCHAND. Nous nous engageons à protéger votre vie privée et à assurer la
              sécurité de vos informations personnelles.
            </p>
          </section>

          {/* 1. Informations Collectées */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Informations Collectées</h2>
            <p className="text-gray-600 mb-4">Nous collectons les types d'informations suivants :</p>
            <ul className="space-y-3 text-gray-600">
              <li>
                <strong className="text-gray-800">Informations Personnelles :</strong> Nom, prénom, adresse e-mail,
                numéro de téléphone, adresse physique, et autres informations similaires que vous fournissez lors de
                l'inscription, de la commande, ou de la communication avec nous.
              </li>
              <li>
                <strong className="text-gray-800">Informations de Commande :</strong> Détails des produits ou livres
                commandés, informations de paiement, historique des commandes.
              </li>
              <li>
                <strong className="text-gray-800">Informations de Connexion :</strong> Identifiants de connexion,
                adresse IP, type de navigateur, et autres informations techniques concernant votre connexion.
              </li>
              <li>
                <strong className="text-gray-800">Informations de Feedback :</strong> Commentaires et évaluations que
                vous laissez concernant les produits ou services, ainsi que les incidents signalés.
              </li>
            </ul>
          </section>

          {/* 2. Utilisation des Informations */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Utilisation des Informations</h2>
            <p className="text-gray-600 mb-4">Nous utilisons vos informations personnelles pour :</p>
            <ul className="space-y-3 text-gray-600">
              <li>
                <strong className="text-gray-800">Gestion des Commandes :</strong> Traiter vos commandes, gérer le
                paiement et la livraison des produits.
              </li>
              <li>
                <strong className="text-gray-800">Amélioration des Services :</strong> Analyser les ventes, les
                performances, et améliorer nos services en fonction de vos retours et des données collectées.
              </li>
              <li>
                <strong className="text-gray-800">Communication :</strong> Vous informer sur vos commandes, les
                nouvelles fonctionnalités, les offres spéciales et autres informations pertinentes.
              </li>
              <li>
                <strong className="text-gray-800">Gestion des Stocks :</strong> Suivre les niveaux de stock et gérer les
                réapprovisionnements.
              </li>
              <li>
                <strong className="text-gray-800">Gestion des Utilisateurs :</strong> Administrer les comptes
                utilisateurs, les rôles, les permissions, et les autorisations.
              </li>
              <li>
                <strong className="text-gray-800">Gestion des Points de Vente :</strong> Gérer les informations sur les
                écoles et les points de vente, ainsi que l'affectation des utilisateurs.
              </li>
              <li>
                <strong className="text-gray-800">Feedback Clients :</strong> Traiter les commentaires et les incidents
                signalés pour améliorer notre service client.
              </li>
            </ul>
          </section>

          {/* 3. Partage des Informations */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Partage des Informations</h2>
            <p className="text-gray-600 mb-4">
              Nous ne partageons vos informations personnelles que dans les circonstances suivantes :
            </p>
            <ul className="space-y-3 text-gray-600">
              <li>
                <strong className="text-gray-800">Avec des Partenaires de Confiance :</strong> Nous pouvons partager des
                informations avec des partenaires tiers pour traiter les paiements, gérer les expéditions, ou fournir
                des services associés. Ces partenaires sont tenus de protéger vos informations et de les utiliser
                uniquement dans le cadre des services fournis.
              </li>
              <li>
                <strong className="text-gray-800">Conformité Légale :</strong> Nous pouvons divulguer vos informations
                si cela est requis par la loi ou pour protéger nos droits, notre sécurité, ou celle des autres.
              </li>
              <li>
                <strong className="text-gray-800">Avec Votre Consentement :</strong> Nous pouvons partager vos
                informations si vous avez donné votre consentement explicitement pour une telle divulgation.
              </li>
            </ul>
          </section>

          {/* 4. Sécurité des Informations */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">4. Sécurité des Informations</h2>
            <p className="text-gray-600">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles
              contre l'accès non autorisé, la divulgation, la modification ou la destruction. Cependant, aucune méthode
              de transmission sur Internet ou de stockage électronique n'est totalement sécurisée. Nous nous efforçons
              de protéger vos informations, mais nous ne pouvons garantir leur sécurité absolue.
            </p>
          </section>

          {/* 5. Vos Droits */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">5. Vos Droits</h2>
            <p className="text-gray-600 mb-4">
              Conformément aux lois sur la protection des données, vous avez les droits suivants concernant vos
              informations personnelles :
            </p>
            <ul className="space-y-3 text-gray-600">
              <li>
                <strong className="text-gray-800">Accès :</strong> Vous pouvez demander l'accès aux informations que
                nous détenons sur vous.
              </li>
              <li>
                <strong className="text-gray-800">Rectification :</strong> Vous pouvez demander la correction de toute
                information inexacte ou incomplète.
              </li>
              <li>
                <strong className="text-gray-800">Suppression :</strong> Vous pouvez demander la suppression de vos
                informations personnelles, sous réserve de certaines exceptions légales.
              </li>
              <li>
                <strong className="text-gray-800">Opposition :</strong> Vous pouvez vous opposer à l'utilisation de vos
                informations personnelles dans certains cas.
              </li>
            </ul>
            <p className="text-gray-600 mt-4">
              Pour exercer ces droits, veuillez nous contacter à l'adresse suivante :{" "}
              <a href="mailto:contact@lahamarchand.com" className="text-blue-600 hover:underline">
                contact@lahamarchand.com
              </a>
              .
            </p>
          </section>

          {/* 6. Cookies et Technologies Similaires */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">6. Cookies et Technologies Similaires</h2>
            <p className="text-gray-600">
              Nous utilisons des cookies et d'autres technologies similaires pour améliorer votre expérience sur notre
              plateforme, analyser l'utilisation, et personnaliser le contenu. Vous pouvez gérer vos préférences en
              matière de cookies via les paramètres de votre navigateur.
            </p>
          </section>

          {/* 7. Modifications de la Politique */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">7. Modifications de la Politique</h2>
            <p className="text-gray-600">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les
              modifications seront publiées sur notre site web avec une date de mise à jour. Nous vous encourageons à
              consulter régulièrement cette politique pour rester informé de toute modification.
            </p>
          </section>

          {/* 8. Contact */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">8. Contact</h2>
            <p className="text-gray-600 mb-4">
              Pour toute question ou préoccupation concernant cette politique de confidentialité, veuillez nous
              contacter à :
            </p>
            <div className="text-gray-600 space-y-1">
              <p>
                <strong className="text-gray-800">LAHA EDITIONS Sarl</strong>
              </p>
              <p>01 BP 5621, Cotonou</p>
              <p>
                <a href="mailto:contact@lahamarchand.com" className="text-blue-600 hover:underline">
                  contact@lahamarchand.com
                </a>
              </p>
              <p>+229 97 89 82 42</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
