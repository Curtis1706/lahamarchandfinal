import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { jsPDF } from "jspdf"

export const dynamic = 'force-dynamic'

// GET /api/pdg/proforma/[id]/pdf - Générer le PDF du proforma
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const proformaId = params.id

    // Récupérer le proforma avec toutes ses relations
    const proforma = await prisma.proforma.findUnique({
      where: { id: proformaId },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contact: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                price: true
              }
            }
          },
          orderBy: {
            work: {
              title: 'asc'
            }
          }
        }
      }
    })

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma introuvable' }, { status: 404 })
    }

    // Vérifier que le proforma a des items
    if (!proforma.items || proforma.items.length === 0) {
      console.error('Proforma has no items:', proforma.id)
      return NextResponse.json({ error: 'Le proforma n\'a pas d\'articles' }, { status: 400 })
    }

    console.log('Generating PDF for proforma:', proforma.reference, 'with', proforma.items.length, 'items')

    // Générer le PDF avec jsPDF
    let pdfBuffer: Buffer
    try {
      console.log('Starting PDF generation...')
      pdfBuffer = await generateProformaPDF(proforma)
      console.log('PDF generation completed')
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty')
      }

      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes')
    } catch (pdfError: any) {
      console.error('❌ Error in generateProformaPDF:', pdfError)
      console.error('PDF Error message:', pdfError?.message)
      console.error('PDF Error stack:', pdfError?.stack)
      throw pdfError
    }

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proforma-${proforma.reference}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error generating proforma PDF:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code
    })
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération du PDF',
        message: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

async function generateProformaPDF(proforma: any): Promise<Buffer> {
  try {
    console.log('Creating jsPDF document...')
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin
    
    const recipient = proforma.partner || proforma.user
    const date = format(new Date(proforma.createdAt), 'dd MMMM yyyy')
    
    // Couleurs (jsPDF utilise RGB 0-255)
    const primaryColor = [105, 103, 206] // #6967CE
    const textColor = [51, 51, 51] // #333333
    const lightGray = [102, 102, 102] // #666666
    
    // En-tête - LAHA MARCHAND
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('LAHA MARCHAND', margin, yPosition)
    
    yPosition += 8
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Gabon', margin, yPosition)
    
    yPosition += 5
    doc.text('contact@lahamarchand.com', margin, yPosition)
    
    // Titre PROFORMA à droite
    const rightX = pageWidth - margin
    yPosition = margin
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.text('PROFORMA', rightX, yPosition, { align: 'right' })
    
    yPosition += 8
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(`Réf: ${proforma.reference}`, rightX, yPosition, { align: 'right' })
    
    yPosition += 6
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(10)
    doc.text(getStatusLabel(proforma.status), rightX, yPosition, { align: 'right' })
    
    yPosition = margin + 40
    
    // Ligne de séparation
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    
    yPosition += 10
    
    // Section Destinataire
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Destinataire', margin, yPosition)
    
    yPosition += 8
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nom: ${recipient?.name || 'N/A'}`, margin, yPosition)
    
    if (recipient?.email) {
      yPosition += 6
      doc.text(`Email: ${recipient.email}`, margin, yPosition)
    }
    
    if (recipient?.phone) {
      yPosition += 6
      doc.text(`Téléphone: ${recipient.phone}`, margin, yPosition)
    }
    
    if (proforma.partner?.address) {
      yPosition += 6
      doc.text(`Adresse: ${proforma.partner.address}`, margin, yPosition)
    }
    
    // Section Informations à droite
    let yInfo = margin + 50
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Informations', rightX, yInfo, { align: 'right' })
    
    yInfo += 8
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Date d'émission: ${date}`, rightX, yInfo, { align: 'right' })
    
    if (proforma.deliveryZone) {
      yInfo += 6
      doc.text(`Zone de livraison: ${proforma.deliveryZone}`, rightX, yInfo, { align: 'right' })
    }
    
    yInfo += 6
    doc.text(`Créé par: ${proforma.createdBy.name}`, rightX, yInfo, { align: 'right' })
    
    yPosition = Math.max(yPosition, yInfo) + 15
    
    // Tableau des articles
    const tableTop = yPosition
    const itemHeight = 8
    const tableLeft = margin
    const tableWidth = pageWidth - (2 * margin)
    const colWidths = {
      ref: 25,
      description: 90,
      qty: 20,
      price: 30,
      total: 30
    }
    
    // En-tête du tableau
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(tableLeft, tableTop, tableWidth, 10, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    let xPos = tableLeft + 2
    doc.text('Réf.', xPos, tableTop + 7)
    xPos += colWidths.ref
    doc.text('Description', xPos, tableTop + 7)
    xPos += colWidths.description
    doc.text('Qté', xPos + colWidths.qty / 2, tableTop + 7, { align: 'center' })
    xPos += colWidths.qty
    doc.text('Prix unit.', xPos + colWidths.price, tableTop + 7, { align: 'right' })
    xPos += colWidths.price
    doc.text('Total', xPos + colWidths.total, tableTop + 7, { align: 'right' })
    
    // Lignes du tableau
    let currentY = tableTop + 10
    if (proforma.items && proforma.items.length > 0) {
      proforma.items.forEach((item: any, index: number) => {
        // Ligne de fond alternée
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245)
          doc.rect(tableLeft, currentY, tableWidth, itemHeight, 'F')
        }
        
        const isbn = item.work?.isbn || 'N/A'
        const title = item.work?.title || 'N/A'
        const quantity = item.quantity || 0
        const unitPrice = item.unitPrice || 0
        const total = item.total || (unitPrice * quantity)
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        xPos = tableLeft + 2
        doc.text(String(isbn).substring(0, 15), xPos, currentY + 6, { maxWidth: colWidths.ref - 2 })
        xPos += colWidths.ref
        doc.text(String(title).substring(0, 50), xPos, currentY + 6, { maxWidth: colWidths.description - 2 })
        xPos += colWidths.description
        doc.text(String(quantity), xPos + colWidths.qty / 2, currentY + 6, { align: 'center' })
        xPos += colWidths.qty
        // Formater les nombres sans toLocaleString pour éviter les problèmes d'encodage
        const formattedPrice = formatNumber(unitPrice)
        doc.text(`${formattedPrice} F CFA`, xPos + colWidths.price, currentY + 6, { align: 'right' })
        xPos += colWidths.price
        const formattedTotal = formatNumber(total)
        doc.text(`${formattedTotal} F CFA`, xPos + colWidths.total, currentY + 6, { align: 'right' })
        
        currentY += itemHeight
      })
    }
    
    // Bordure du tableau
    doc.setDrawColor(221, 221, 221)
    doc.setLineWidth(0.1)
    doc.rect(tableLeft, tableTop, tableWidth, currentY - tableTop)
    
    yPosition = currentY + 10
    
    // Totaux à droite
    const totalsLeft = pageWidth - margin - 100
    let totalsY = yPosition
    
    const subtotal = Number(proforma.subtotal || 0)
    const discount = Number(proforma.discount || 0)
    const tax = Number(proforma.tax || 0)
    const total = Number(proforma.total || 0)
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Sous-total HT:', totalsLeft, totalsY, { align: 'right' })
    doc.text(`${formatNumber(subtotal + discount)} F CFA`, pageWidth - margin, totalsY, { align: 'right' })
    
    if (discount > 0) {
      totalsY += 6
      doc.text('Remise:', totalsLeft, totalsY, { align: 'right' })
      doc.text(`-${formatNumber(discount)} F CFA`, pageWidth - margin, totalsY, { align: 'right' })
    }
    
    totalsY += 6
    doc.text('Sous-total après remise:', totalsLeft, totalsY, { align: 'right' })
    doc.text(`${formatNumber(subtotal)} F CFA`, pageWidth - margin, totalsY, { align: 'right' })
    
    totalsY += 6
    doc.text('TVA (18%):', totalsLeft, totalsY, { align: 'right' })
    doc.text(`${formatNumber(tax)} F CFA`, pageWidth - margin, totalsY, { align: 'right' })
    
    totalsY += 8
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.3)
    doc.line(totalsLeft, totalsY, pageWidth - margin, totalsY)
    
    totalsY += 5
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL TTC:', totalsLeft, totalsY, { align: 'right' })
    doc.text(`${formatNumber(total)} F CFA`, pageWidth - margin, totalsY, { align: 'right' })
    
    totalsY += 3
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.3)
    doc.line(totalsLeft, totalsY, pageWidth - margin, totalsY)
    
    // Notes
    if (proforma.notes) {
      totalsY += 10
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', margin, totalsY)
      
      totalsY += 7
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const splitNotes = doc.splitTextToSize(proforma.notes, pageWidth - 2 * margin)
      doc.text(splitNotes, margin, totalsY)
      totalsY += splitNotes.length * 5
    }
    
    // Pied de page
    const footerY = pageHeight - 20
    
    doc.setDrawColor(221, 221, 221)
    doc.setLineWidth(0.1)
    doc.line(margin, footerY, pageWidth - margin, footerY)
    
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2])
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Ce document est un proforma et n\'a pas de valeur comptable.', pageWidth / 2, footerY + 5, { align: 'center' })
    doc.text('Validité: 30 jours à compter de la date d\'émission', pageWidth / 2, footerY + 10, { align: 'center' })
    doc.text(`LAHA MARCHAND - ${new Date().getFullYear()}`, pageWidth / 2, footerY + 15, { align: 'center' })
    
    // Générer le buffer PDF
    const pdfOutput = doc.output('arraybuffer')
    const pdfBuffer = Buffer.from(pdfOutput)
    
    console.log('PDF buffer created successfully, size:', pdfBuffer.length)
    return pdfBuffer
    
  } catch (error: any) {
    console.error('Error in generateProformaPDF:', error)
    console.error('Error stack:', error?.stack)
    throw error
  }
}

function formatNumber(num: number): string {
  // Formater le nombre avec des espaces comme séparateurs de milliers
  // Utiliser une méthode simple pour éviter les problèmes d'encodage avec jsPDF
  const numStr = Math.round(num * 100) / 100 // Arrondir à 2 décimales
  const parts = numStr.toString().split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1] || '00'
  
  // Ajouter des espaces comme séparateurs de milliers manuellement
  let formattedInteger = ''
  for (let i = integerPart.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedInteger = ' ' + formattedInteger
    }
    formattedInteger = integerPart[i] + formattedInteger
  }
  
  // Limiter à 2 décimales
  const finalDecimal = decimalPart.length > 2 ? decimalPart.substring(0, 2) : decimalPart.padEnd(2, '0')
  
  return `${formattedInteger},${finalDecimal}`
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'PENDING': 'En attente',
    'SENT': 'Envoyé',
    'AWAITING_RESPONSE': 'En attente de réponse',
    'ACCEPTED': 'Accepté',
    'REJECTED': 'Rejeté',
    'CONVERTED': 'Converti',
    'CANCELLED': 'Annulé'
  }
  return labels[status] || status
}
