"use client"

import { GuestBanner } from "@/components/guest-banner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  const faqs = [
    {
      question: "Qu'est-ce que le mode invité ?",
      answer: "Le mode invité vous permet d'explorer certaines fonctionnalités publiques de la plateforme sans créer de compte. Vous pouvez consulter le catalogue des œuvres et les projets publics, mais certaines fonctionnalités nécessitent un compte."
    },
    {
      question: "Comment créer un compte ?",
      answer: "Cliquez sur 'Créer un compte' dans le menu, remplissez le formulaire d'inscription avec vos informations, puis attendez la validation par un administrateur."
    },
    {
      question: "Quels sont les différents rôles disponibles ?",
      answer: "La plateforme propose plusieurs rôles : PDG (gestion complète), Auteur (création d'œuvres), Concepteur (gestion de projets), Partenaire (distribution), Représentant (gestion de zones), et Client (achat d'œuvres)."
    },
    {
      question: "Comment puis-je publier une œuvre ?",
      answer: "Une fois votre compte d'auteur validé, vous pouvez créer une nouvelle œuvre depuis votre tableau de bord. L'œuvre sera soumise pour validation avant publication."
    },
    {
      question: "Comment fonctionne le système de droits d'auteur ?",
      answer: "Les droits d'auteur sont calculés automatiquement sur les ventes de vos œuvres. Vous pouvez consulter vos droits d'auteur depuis votre tableau de bord."
    },
    {
      question: "Puis-je modifier une œuvre après publication ?",
      answer: "Oui, vous pouvez modifier vos œuvres, mais les modifications doivent être validées avant d'être appliquées."
    }
  ]

  return (
    <>
      <GuestBanner />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Questions fréquentes</h1>
            <p className="text-xl text-gray-600">
              Trouvez des réponses aux questions les plus courantes
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

