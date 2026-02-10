import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/works - Créer une œuvre (nouveau workflow)
export async function POST(request: NextRequest) {

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[API Works] Received body:", JSON.stringify(body, null, 2));

    const {
      title,
      description,
      disciplineId,
      authorId, // Seuls les auteurs peuvent créer des œuvres
      projectId,
      category,
      targetAudience,
      educationalObjectives,
      contentType,
      estimatedPrice = 0,
      price, // Support du champ 'price' envoyé par le CONCEPTEUR
      tva,
      keywords = [],
      files = [],
      status = "PENDING",
      collectionId,
      coverImage,
      isbn,
      internalCode
    } = body;

    // Utiliser 'price' si fourni, sinon 'estimatedPrice'
    const finalPrice = price !== undefined && price !== null ? price : estimatedPrice;



    // Validation des champs obligatoires
    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre de l'œuvre est obligatoire" }, { status: 400 });
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: "La description de l'œuvre est obligatoire" }, { status: 400 });
    }

    if (!disciplineId) {
      return NextResponse.json({ error: "La discipline est obligatoire" }, { status: 400 });
    }

    if (!authorId) {
      return NextResponse.json({ error: "L'ID de l'auteur est obligatoire" }, { status: 400 });
    }

    // contentType n'est plus obligatoire - peut être null

    // Vérifier que l'utilisateur connecté a les permissions
    // Les concepteurs peuvent créer des œuvres pour n'importe quel auteur
    // Les auteurs ne peuvent créer que pour eux-mêmes
    // Les PDG peuvent créer pour n'importe qui
    const concepteurId = body.concepteurId || null;
    if (session.user.role === "AUTEUR" && session.user.id !== authorId) {
      // Les PDG et CONCEPTEUR ne sont pas concernés par cette condition car role === "AUTEUR" filtre déjà
      return NextResponse.json({ error: "Vous ne pouvez créer une œuvre que pour vous-même" }, { status: 403 });
    }

    // Vérifier que la discipline existe
    const discipline = await prisma.discipline.findUnique({
      where: { id: disciplineId }
    });

    if (!discipline) {
      return NextResponse.json({ error: "Discipline non trouvée" }, { status: 404 });
    }

    // Vérifier que l'auteur existe et a le bon rôle
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!author) {
      return NextResponse.json({ error: "Auteur non trouvé" }, { status: 404 });
    }

    if (author.role !== "AUTEUR") {
      return NextResponse.json({ error: "Seul un utilisateur avec le rôle AUTEUR peut être assigné comme auteur" }, { status: 403 });
    }

    // Si un projectId est fourni, vérifier qu'il existe et est validé
    let project = null;
    let projectConcepteurId = null;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
          status: true,
          concepteurId: true,
          concepteur: { select: { id: true, name: true, email: true } },
          discipline: { select: { name: true } }
        }
      });

      if (!project) {
        return NextResponse.json({ error: "Projet parent non trouvé" }, { status: 404 });
      }

      if (project.status !== "ACCEPTED") {
        return NextResponse.json({ error: "Le projet parent doit être validé pour y rattacher une œuvre" }, { status: 400 });
      }

      // Récupérer l'ID du concepteur du projet pour l'assignation automatique
      projectConcepteurId = project.concepteurId;
    }

    // Déterminer le concepteurId : priorité au concepteurId fourni, puis au concepteur du projet, puis à l'utilisateur connecté si c'est un concepteur
    let finalConcepteurId = concepteurId || projectConcepteurId;
    if (!finalConcepteurId && session.user.role === "CONCEPTEUR") {
      finalConcepteurId = session.user.id;
    }

    // Générer un ISBN unique si non fourni
    let workIsbn = isbn;

    if (!workIsbn) {
      // Boucle jusqu'à trouver un ISBN unique
      let isUnique = false;
      while (!isUnique) {
        // Générer un ISBN plus unique avec timestamp + random
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 100000);
        workIsbn = `978-${timestamp.toString().slice(-9)}-${random.toString().padStart(5, '0')}`;

        // Vérifier si cet ISBN existe déjà
        const existing = await prisma.work.findUnique({
          where: { isbn: workIsbn }
        });

        isUnique = !existing;
      }
    }

    // Créer l'œuvre
    const work = await prisma.work.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        isbn: workIsbn,
        internalCode: internalCode?.trim() || null,
        price: finalPrice || 0,
        tva: tva !== undefined ? parseFloat(tva) : 0.18,
        stock: 0,
        minStock: 0,

        // Nouveaux champs
        category: category || null,
        targetAudience: targetAudience || null,
        educationalObjectives: educationalObjectives?.trim() || null,
        contentType: contentType,
        keywords: keywords.length > 0 ? keywords.join(',') : null,
        files: files.length > 0 || coverImage || collectionId ? JSON.stringify({
          files: files.length > 0 ? files : [],
          coverImage: coverImage || null,
          collectionId: collectionId || null
        }) : null,

        // Statut et dates
        status: status,
        submittedAt: status === "PENDING" ? new Date() : null,

        // Relations
        discipline: { connect: { id: disciplineId } },
        author: { connect: { id: authorId } },
        project: projectId ? { connect: { id: projectId } } : undefined,
        // Assignation au concepteur (du projet, fourni explicitement, ou utilisateur connecté si concepteur)
        concepteur: finalConcepteurId ? { connect: { id: finalConcepteurId } } : undefined
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });


    // Créer des notifications pour les PDG
    try {
      const pdgUsers = await prisma.user.findMany({
        where: { role: "PDG", status: "ACTIVE" },
        select: { id: true, name: true }
      });

      if (pdgUsers.length > 0) {
        await prisma.notification.createMany({
          data: pdgUsers.map(pdg => ({
            userId: pdg.id,
            title: "Nouvelle œuvre soumise pour validation",
            message: `L'auteur ${work.author?.name} a soumis l'œuvre "${work.title}" pour validation. ${work.project ? `Issue du projet "${work.project.title}".` : 'Soumission directe.'}`,
            type: "WORK_SUBMITTED",
            read: false,
            data: JSON.stringify({
              workId: work.id,
              workTitle: work.title,
              authorId: work.authorId,
              authorName: work.author?.name,
              disciplineName: work.discipline?.name,
              projectId: work.projectId,
              projectTitle: work.project?.title,
              contentType: work.contentType
            })
          })),
          skipDuplicates: true
        });
      }
    } catch (notificationError) {
      console.error("⚠️ Erreur création notifications PDG:", notificationError);
    }

    return NextResponse.json(work, { status: 201 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la création de l'œuvre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'œuvre: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/works - Récupérer les œuvres avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const status = searchParams.get('status');
    const disciplineId = searchParams.get('disciplineId');
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;


    // Construire les conditions de filtre
    let whereClause: any = {};

    if (authorId) {
      whereClause.authorId = authorId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (disciplineId) {
      whereClause.disciplineId = disciplineId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Si l'utilisateur n'est pas PDG, appliquer des restrictions
    if (session.user.role !== "PDG") {
      if (session.user.role === "AUTEUR") {
        // Les auteurs voient leurs propres œuvres (tous statuts)
        whereClause.authorId = session.user.id;
      } else {
        // Pour les autres rôles (CLIENT, PARTENAIRE, REPRESENTANT, etc.), 
        // ne montrer QUE les livres PUBLISHED
        whereClause.status = "PUBLISHED";
      }
    } else {
      // Le PDG peut voir tous les statuts, mais si aucun filtre n'est spécifié,
      // on peut optionnellement filtrer par défaut
      // (pour l'instant, on laisse le PDG voir tout)
    }


    // Pour le PDG, si la clause WHERE est vide, on récupère tous les works
    // Sinon, on applique les filtres
    const whereForQuery = Object.keys(whereClause).length === 0 ? undefined : whereClause;

    let works: any[] = []
    let total = 0

    try {

      // Essayer d'abord avec les relations
      try {
        [works, total] = await Promise.all([
          prisma.work.findMany({
            where: whereForQuery,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              },
              discipline: {
                select: {
                  id: true,
                  name: true
                }
              },
              project: {
                select: {
                  id: true,
                  title: true,
                  status: true
                }
              },
              concepteur: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            skip,
            take: limit
          }),
          prisma.work.count({ where: whereForQuery })
        ])
      } catch (relationError: any) {
        console.error('❌ Erreur avec les relations:', relationError);
        console.error('❌ Message:', relationError.message);
        // Si l'erreur vient des relations, essayer sans relations
        if (relationError.message?.includes('Record to update not found') ||
          relationError.message?.includes('Foreign key constraint') ||
          relationError.code === 'P2025') {
          [works, total] = await Promise.all([
            prisma.work.findMany({
              where: whereForQuery,
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                },
                discipline: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              skip,
              take: limit
            }),
            prisma.work.count({ where: whereForQuery })
          ]);
        } else {
          throw relationError;
        }
      }


      // Si aucun work n'est retourné mais que total > 0, il y a un problème
      if (works.length === 0 && total > 0) {

        // Essayer une requête sans relations pour voir si le problème vient des relations
        try {
          const worksWithoutRelations = await prisma.work.findMany({
            where: whereForQuery,
            select: {
              id: true,
              title: true,
              status: true,
              authorId: true,
              disciplineId: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
          });
          if (worksWithoutRelations.length > 0) {
            // Utiliser ces works sans relations et enrichir manuellement
            works = worksWithoutRelations as any;
          } else if (skip > 0) {
            // Essayer sans skip
            const worksNoSkip = await prisma.work.findMany({
              where: whereForQuery,
              select: {
                id: true,
                title: true,
                status: true,
                authorId: true,
                disciplineId: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: limit
            });
            if (worksNoSkip.length > 0) {
              works = worksNoSkip as any;
            }
          }
        } catch (noRelError) {
          console.error("❌ Erreur requête sans relations:", noRelError);
        }
      }

      // Si toujours 0 works, essayer une requête complètement sans filtres avec SQL brut
      if (works.length === 0 && session.user.role === "PDG") {
        try {
          // Utiliser SQL brut pour éviter les problèmes d'enum
          const allWorksRaw = await prisma.$queryRawUnsafe<any[]>(
            `SELECT 
              w.*,
              u1.id as "author_id", u1.name as "author_name", u1.email as "author_email", u1.role as "author_role",
              d.id as "discipline_id", d.name as "discipline_name",
              u2.id as "concepteur_id", u2.name as "concepteur_name", u2.email as "concepteur_email",
              u3.id as "reviewer_id", u3.name as "reviewer_name", u3.email as "reviewer_email",
              p.id as "project_id", p.title as "project_title", p.status as "project_status"
            FROM "Work" w
            LEFT JOIN "User" u1 ON w."authorId" = u1.id
            LEFT JOIN "Discipline" d ON w."disciplineId" = d.id
            LEFT JOIN "User" u2 ON w."concepteurId" = u2.id
            LEFT JOIN "User" u3 ON w."reviewerId" = u3.id
            LEFT JOIN "Project" p ON w."projectId" = p.id
            ORDER BY w."createdAt" DESC
            LIMIT $1`,
            limit
          );

          // Transformer les résultats SQL en format Prisma
          works = allWorksRaw.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            isbn: row.isbn,
            internalCode: row.internalCode,
            price: row.price,
            tva: row.tva,
            discountRate: row.discountRate,
            stock: row.stock,
            minStock: row.minStock,
            maxStock: row.maxStock,
            physicalStock: row.physicalStock,
            category: row.category,
            targetAudience: row.targetAudience,
            educationalObjectives: row.educationalObjectives,
            contentType: row.contentType,
            keywords: row.keywords,
            files: row.files,
            validationComment: row.validationComment,
            rejectionReason: row.rejectionReason,
            disciplineId: row.disciplineId,
            status: row.status,
            publishedAt: row.publishedAt,
            publicationDate: row.publicationDate,
            version: row.version,
            submittedAt: row.submittedAt,
            reviewedAt: row.reviewedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            authorId: row.authorId,
            reviewerId: row.reviewerId,
            concepteurId: row.concepteurId,
            projectId: row.projectId,
            author: row.author_id ? {
              id: row.author_id,
              name: row.author_name,
              email: row.author_email,
              role: row.author_role
            } : null,
            discipline: row.discipline_id ? {
              id: row.discipline_id,
              name: row.discipline_name
            } : null,
            concepteur: row.concepteur_id ? {
              id: row.concepteur_id,
              name: row.concepteur_name,
              email: row.concepteur_email
            } : null,
            reviewer: row.reviewer_id ? {
              id: row.reviewer_id,
              name: row.reviewer_name,
              email: row.reviewer_email
            } : null,
            project: row.project_id ? {
              id: row.project_id,
              title: row.project_title,
              status: row.project_status
            } : null
          }));

          if (works.length > 0) {
            const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
              `SELECT COUNT(*) as count FROM "Work"`
            );
            total = Number(countResult[0]?.count || 0);
          }
        } catch (noFilterError) {
          console.error("❌ Erreur requête SQL brut sans filtres:", noFilterError);
        }
      }
    } catch (findManyError: any) {
      console.error('❌ Error in work.findMany:', findManyError)
      console.error('❌ Error message:', findManyError.message)
      console.error('❌ Error code:', findManyError.code)
      console.error('❌ Stack:', findManyError.stack)

      // Si l'erreur est liée à un statut invalide (SUSPENDED), utiliser une approche alternative
      if (findManyError.message?.includes('not found in enum') || findManyError.message?.includes('SUSPENDED')) {

        try {
          // Utiliser une requête SQL brute pour récupérer uniquement les IDs
          // Cela évite les problèmes d'enum Prisma
          const validStatuses = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ON_SALE', 'OUT_OF_STOCK', 'DISCONTINUED', 'SUSPENDED']

          // Construire la clause WHERE en SQL
          let sqlConditions: string[] = []
          const sqlParams: any[] = []

          // Pour le PDG, si whereClause est vide, on ne filtre pas par statut
          if (whereClause.status && validStatuses.includes(whereClause.status)) {
            sqlConditions.push(`status = $${sqlParams.length + 1}`)
            sqlParams.push(whereClause.status)
          } else if (whereClause.status && !validStatuses.includes(whereClause.status)) {
            // Si le statut est invalide, on filtre uniquement les statuts valides
            sqlConditions.push(`status IN (${validStatuses.map((_, i) => `$${sqlParams.length + i + 1}`).join(', ')})`)
            sqlParams.push(...validStatuses)
          }
          // Si pas de statut dans whereClause, on ne filtre pas (PDG voit tout)

          if (whereClause.authorId) {
            sqlConditions.push(`"authorId" = $${sqlParams.length + 1}`)
            sqlParams.push(whereClause.authorId)
          }

          if (whereClause.disciplineId) {
            sqlConditions.push(`"disciplineId" = $${sqlParams.length + 1}`)
            sqlParams.push(whereClause.disciplineId)
          }

          if (whereClause.projectId) {
            sqlConditions.push(`"projectId" = $${sqlParams.length + 1}`)
            sqlParams.push(whereClause.projectId)
          }

          const whereSQL = sqlConditions.length > 0 ? `WHERE ${sqlConditions.join(' AND ')}` : ''

          // Récupérer les IDs avec SQL brut
          const limitParam = sqlParams.length + 1;
          const offsetParam = sqlParams.length + 2;
          const query = `SELECT id FROM "Work" ${whereSQL} ORDER BY "createdAt" DESC LIMIT $${limitParam} OFFSET $${offsetParam}`;

          const workIdsResult = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
            query,
            ...sqlParams,
            limit,
            skip
          )

          const ids = workIdsResult.map(w => w.id)

          // Compter le total
          const countQuery = `SELECT COUNT(*) as count FROM "Work" ${whereSQL}`;
          const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            countQuery,
            ...sqlParams
          )
          total = Number(countResult[0]?.count || 0)

          // Si on a des IDs, récupérer les works complets avec SQL brut pour éviter les problèmes d'enum
          if (ids.length > 0) {

            // Utiliser SQL brut pour récupérer les works complets
            // Construire la requête avec les IDs directement (sécurisé car les IDs viennent de notre propre DB)
            const idsList = ids.map(id => `'${id.replace(/'/g, "''")}'`).join(', ');
            const worksRaw = await prisma.$queryRawUnsafe<any[]>(
              `SELECT 
                w.*,
                u1.id as "author_id", u1.name as "author_name", u1.email as "author_email", u1.role as "author_role",
                d.id as "discipline_id", d.name as "discipline_name",
                u2.id as "concepteur_id", u2.name as "concepteur_name", u2.email as "concepteur_email",
                u3.id as "reviewer_id", u3.name as "reviewer_name", u3.email as "reviewer_email",
                p.id as "project_id", p.title as "project_title", p.status as "project_status"
              FROM "Work" w
              LEFT JOIN "User" u1 ON w."authorId" = u1.id
              LEFT JOIN "Discipline" d ON w."disciplineId" = d.id
              LEFT JOIN "User" u2 ON w."concepteurId" = u2.id
              LEFT JOIN "User" u3 ON w."reviewerId" = u3.id
              LEFT JOIN "Project" p ON w."projectId" = p.id
              WHERE w.id IN (${idsList})
              ORDER BY w."createdAt" DESC`
            );

            // Transformer les résultats SQL en format Prisma
            works = worksRaw.map((row: any) => ({
              id: row.id,
              title: row.title,
              description: row.description,
              isbn: row.isbn,
              internalCode: row.internalCode,
              price: row.price,
              tva: row.tva,
              discountRate: row.discountRate,
              stock: row.stock,
              minStock: row.minStock,
              maxStock: row.maxStock,
              physicalStock: row.physicalStock,
              category: row.category,
              targetAudience: row.targetAudience,
              educationalObjectives: row.educationalObjectives,
              contentType: row.contentType,
              keywords: row.keywords,
              files: row.files,
              validationComment: row.validationComment,
              rejectionReason: row.rejectionReason,
              disciplineId: row.disciplineId,
              status: row.status,
              publishedAt: row.publishedAt,
              publicationDate: row.publicationDate,
              version: row.version,
              submittedAt: row.submittedAt,
              reviewedAt: row.reviewedAt,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
              authorId: row.authorId,
              reviewerId: row.reviewerId,
              concepteurId: row.concepteurId,
              projectId: row.projectId,
              author: row.author_id ? {
                id: row.author_id,
                name: row.author_name,
                email: row.author_email,
                role: row.author_role
              } : null,
              discipline: row.discipline_id ? {
                id: row.discipline_id,
                name: row.discipline_name
              } : null,
              concepteur: row.concepteur_id ? {
                id: row.concepteur_id,
                name: row.concepteur_name,
                email: row.concepteur_email
              } : null,
              reviewer: row.reviewer_id ? {
                id: row.reviewer_id,
                name: row.reviewer_name,
                email: row.reviewer_email
              } : null,
              project: row.project_id ? {
                id: row.project_id,
                title: row.project_title,
                status: row.project_status
              } : null
            }));

          } else {
            works = []
          }
        } catch (sqlError: any) {
          console.error('Error in SQL fallback:', sqlError)
          // En dernier recours, retourner un tableau vide
          works = []
          total = 0
        }
      } else {
        // Pour les autres erreurs, relancer l'erreur
        throw findManyError
      }
    }

    // Calculer les statistiques globales (sans filtre de statut)
    let globalStats: any[] = []
    try {
      globalStats = await prisma.work.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      } as any)
    } catch (groupByError: any) {
      console.error('Error in groupBy:', groupByError)
      console.error('Error message:', groupByError.message)
      console.error('Error code:', groupByError.code)

      // Si l'erreur est liée à un statut invalide, récupérer les stats manuellement
      if (groupByError.message?.includes('not found in enum') || groupByError.message?.includes('SUSPENDED')) {
        try {
          // Utiliser une requête SQL brute pour éviter les problèmes d'enum
          const allWorks = await prisma.$queryRaw<Array<{ status: string }>>`
            SELECT status FROM "Work"
          `

          const statusCounts: Record<string, number> = {}
          allWorks.forEach(work => {
            const status = work.status as string
            // Filtrer uniquement les statuts valides
            const validStatuses = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ON_SALE', 'OUT_OF_STOCK', 'DISCONTINUED', 'SUSPENDED']
            if (validStatuses.includes(status)) {
              statusCounts[status] = (statusCounts[status] || 0) + 1
            } else {
            }
          })

          globalStats = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            _count: { status: count }
          }))
        } catch (manualError) {
          console.error('Error in manual stats calculation:', manualError)
          // En cas d'erreur, retourner des stats vides
          globalStats = []
        }
      } else {
        // Pour les autres erreurs, essayer quand même le calcul manuel avec SQL brut
        try {
          const statusCountsRaw = await prisma.$queryRawUnsafe<Array<{ status: string, count: bigint }>>(
            `SELECT status, COUNT(*) as count FROM "Work" GROUP BY status`
          )

          const statusCounts: Record<string, number> = {}
          statusCountsRaw.forEach(row => {
            statusCounts[row.status] = Number(row.count)
          })

          globalStats = Object.entries(statusCounts).map(([status, count]) => ({
            status,
            _count: { status: count }
          }))
        } catch (fallbackError) {
          console.error('Fallback stats calculation failed:', fallbackError)
          globalStats = []
        }
      }
    }

    const totalGlobal = await prisma.work.count();

    const statsFormatted = {
      total: totalGlobal,
      pending: globalStats.find(s => s.status === 'PENDING')?._count.status || 0,
      validated: globalStats.find(s => s.status === 'VALIDATED')?._count.status || 0,
      published: globalStats.find(s => s.status === 'PUBLISHED')?._count.status || 0,
      rejected: globalStats.find(s => s.status === 'REJECTED')?._count.status || 0,
      draft: globalStats.find(s => s.status === 'DRAFT')?._count.status || 0,
      suspended: globalStats.find(s => s.status === 'SUSPENDED')?._count.status || 0,
      onSale: globalStats.find(s => s.status === 'ON_SALE')?._count.status || 0,
      outOfStock: globalStats.find(s => s.status === 'OUT_OF_STOCK')?._count.status || 0,
      discontinued: globalStats.find(s => s.status === 'DISCONTINUED')?._count.status || 0
    };

    // Vérification supplémentaire : compter tous les works dans la base (pour debug)
    try {
      const totalWorksInDb = await prisma.work.count();

      // Si des works existent mais ne sont pas retournés, faire une requête directe sans filtres
      if (totalWorksInDb > 0 && works.length === 0) {
        const whereUsed = (typeof whereForQuery !== 'undefined') ? whereForQuery : whereClause;

        // Requête directe avec SQL brut pour voir tous les works (pour éviter les erreurs d'enum)
        try {
          const allWorksDirect = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id, title, status, "authorId", "disciplineId", "createdAt"
            FROM "Work"
            ORDER BY "createdAt" DESC
            LIMIT 10`
          );
        } catch (directError) {
          console.error("❌ Erreur lors de la requête directe:", directError);
        }
      }
    } catch (countError: any) {
      console.error("❌ Erreur lors du comptage total:", countError);
      // Ne pas utiliser whereForQuery ici car il peut ne pas être défini
      if (countError.message?.includes('whereForQuery')) {
      }
    }


    const response = {
      works,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statsFormatted
    };


    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des œuvres:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des œuvres: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/works - Mettre à jour une œuvre (validation PDG principalement)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { workId, status, validationComment, rejectionReason, ...updateData } = body;

    if (!workId) {
      return NextResponse.json({ error: "ID de l'œuvre requis" }, { status: 400 });
    }

    // Vérifier que l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: { select: { id: true, name: true } }
      }
    });

    if (!existingWork) {
      return NextResponse.json({ error: "Œuvre non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    const isOwner = existingWork.authorId === session.user.id;
    const isPDG = session.user.role === "PDG";

    if (!isOwner && !isPDG) {
      return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres œuvres" }, { status: 403 });
    }

    // Préparer les données de mise à jour
    const dataToUpdate: any = {};

    // Copier les champs simples (non-relationnels)
    const simpleFields = ['title', 'description', 'category', 'targetAudience', 'price', 'tva', 'isbn',
      'internalCode', 'educationalObjectives', 'contentType', 'keywords', 'files',
      'discountRate', 'stock', 'minStock', 'maxStock', 'physicalStock'];

    for (const field of simpleFields) {
      if (updateData[field] !== undefined) {
        dataToUpdate[field] = updateData[field];
      }
    }

    // Gestion spéciale pour 'files' si 'coverImage' ou 'collectionId' sont fournis
    const coverImage = updateData.coverImage;
    const collectionId = updateData.collectionId;

    if (coverImage !== undefined || collectionId !== undefined) {
      // Récupérer les données de fichiers existantes
      let currentFiles: any = { files: [], coverImage: null, collectionId: null };
      if (existingWork.files) {
        try {
          currentFiles = typeof existingWork.files === 'string' ? JSON.parse(existingWork.files) : existingWork.files;
        } catch (e) {
          console.error("Erreur parsing files existants:", e);
        }
      }

      // Mettre à jour avec les nouvelles valeurs si fournies
      if (coverImage !== undefined) currentFiles.coverImage = coverImage;
      if (collectionId !== undefined) currentFiles.collectionId = collectionId;

      // Sauvegarder dans dataToUpdate
      dataToUpdate.files = JSON.stringify(currentFiles);
    }

    // Gérer les relations avec connect
    if (updateData.disciplineId) {
      dataToUpdate.discipline = { connect: { id: updateData.disciplineId } };
    }

    if (updateData.authorId) {
      dataToUpdate.author = { connect: { id: updateData.authorId } };
    }

    if (updateData.concepteurId !== undefined) {
      dataToUpdate.concepteur = updateData.concepteurId
        ? { connect: { id: updateData.concepteurId } }
        : { disconnect: true };
    }

    if (updateData.projectId !== undefined) {
      dataToUpdate.project = updateData.projectId
        ? { connect: { id: updateData.projectId } }
        : { disconnect: true };
    }

    // Si c'est une validation/refus par le PDG
    if (status && isPDG) {
      dataToUpdate.status = status;
      // Vérifier que l'utilisateur PDG existe avant d'assigner reviewerId
      let pdgUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      // Si l'utilisateur n'existe pas avec cet ID, chercher par email
      if (!pdgUser) {
        pdgUser = await prisma.user.findUnique({
          where: { email: session.user.email as string }
        });
      }

      if (pdgUser) {
        dataToUpdate.reviewer = { connect: { id: pdgUser.id } };
      } else {
      }

      dataToUpdate.reviewedAt = new Date();

      if (status === "PUBLISHED") {
        dataToUpdate.publishedAt = new Date();
      }

      if (validationComment) {
        dataToUpdate.validationComment = validationComment;
      }

      if (status === "REJECTED" && rejectionReason) {
        dataToUpdate.rejectionReason = rejectionReason;
      }
    }

    // Mettre à jour l'œuvre
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: dataToUpdate,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Créer audit log et notifications pour validation/refus
    if (status && isPDG && (status === "PUBLISHED" || status === "REJECTED")) {
      try {
        const action = status === "PUBLISHED" ? "WORK_APPROVED" : "WORK_REJECTED";

        // Notification à l'auteur
        const recipientId = updatedWork.authorId;
        if (recipientId) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              title: status === "PUBLISHED" ? "🎉 Œuvre validée !" : "❌ Œuvre refusée",
              message: status === "PUBLISHED"
                ? `Votre œuvre "${updatedWork.title}" a été validée et est maintenant publiée ! ${validationComment ? `Commentaire: ${validationComment}` : ''}`
                : `Votre œuvre "${updatedWork.title}" a été refusée. ${rejectionReason ? `Motif: ${rejectionReason}` : ''} Vous pouvez la modifier et la resoumetre.`,
              type: status === "PUBLISHED" ? "WORK_APPROVED" : "WORK_REJECTED",
              data: JSON.stringify({
                workId: updatedWork.id,
                workTitle: updatedWork.title,
                status: status,
                comment: validationComment || rejectionReason
              })
            }
          });
        }

      } catch (auditError) {
        console.error("⚠️ Erreur création audit/notifications:", auditError);
      }
    }

    return NextResponse.json(updatedWork, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la mise à jour de l'œuvre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'œuvre: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/works - Supprimer une œuvre
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workId = searchParams.get('id');

    if (!workId) {
      return NextResponse.json({ error: "ID de l'œuvre requis" }, { status: 400 });
    }

    // Vérifier que l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        author: { select: { name: true } },
        orderItems: true,
        sales: true
      }
    });

    if (!existingWork) {
      return NextResponse.json({ error: "Œuvre non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    const isOwner = existingWork.authorId === session.user.id;
    const isPDG = session.user.role === "PDG";

    if (!isOwner && !isPDG) {
      return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres œuvres" }, { status: 403 });
    }

    // Vérifier que l'œuvre peut être supprimée
    if (existingWork.status === "PUBLISHED" && !isPDG) {
      return NextResponse.json({ error: "Une œuvre publiée ne peut être supprimée que par un PDG" }, { status: 400 });
    }

    if (existingWork.orderItems.length > 0 || existingWork.sales.length > 0) {
      return NextResponse.json({ error: "Cette œuvre ne peut pas être supprimée car elle a des commandes ou ventes associées" }, { status: 400 });
    }

    // Supprimer l'œuvre
    await prisma.work.delete({
      where: { id: workId }
    });

    return NextResponse.json({ message: "Œuvre supprimée avec succès" }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la suppression de l'œuvre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'œuvre: " + error.message },
      { status: 500 }
    );
  }
}