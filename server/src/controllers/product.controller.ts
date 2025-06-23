import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

// Ottenere tutti i prodotti (con paginazione, filtri e ordinamento)
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    page = "1",
    limit = "10",
    categoryId,
    minPrice,
    maxPrice,
    sortBy = "createdAt", // e.g., titolo, prezzo, createdAt
    sortOrder = "desc", // asc or desc
    search,
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const where: any = {};
  if (categoryId) {
    where.categoria = { some: { id: parseInt(categoryId as string) } };
  }
  if (minPrice || maxPrice) {
    where.prezzo = {};
    if (minPrice) {
      where.prezzo.gte = parseFloat(minPrice as string);
    }
    if (maxPrice) {
      where.prezzo.lte = parseFloat(maxPrice as string);
    }
  }
  if (search) {
    where.OR = [
      { titolo: { contains: search as string, mode: "insensitive" } },
      { descrizione: { contains: search as string, mode: "insensitive" } },
    ];
  }

  const orderBy: any = {};
  const validSortByFields = ["titolo", "prezzo", "createdAt", "updatedAt"];
  if (validSortByFields.includes(sortBy as string)) {
    orderBy[sortBy as string] = sortOrder === "asc" ? "asc" : "desc";
  } else {
    orderBy.createdAt = "desc";
  }

  try {
    const products = await prisma.product.findMany({
      skip: offset,
      take: limitNum,
      where,
      orderBy,
      include: { categoria: true, varianti: { include: { valori: true } } },
    });
    const totalProducts = await prisma.product.count({ where });
    res.json({
      data: products,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
      totalProducts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Errore nel recupero dei prodotti",
      error: (error as Error).message,
    });
  }
};

// Ottenere un singolo prodotto per ID
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        categoria: true,
        orderItems: true,
        cartItems: true,
        varianti: { include: { valori: true } },
      },
    });
    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Errore nel recupero del prodotto",
      error: (error as Error).message,
    });
  }
};

// Creare un nuovo prodotto (Admin only - protetto da middleware)
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const {
    titolo,
    descrizione,
    prezzo,
    immagine,
    categoriaId,
    stock,
    varianti,
  } = req.body;
  if (!titolo || prezzo === undefined || categoriaId === undefined) {
    res.status(400).json({
      message: "titolo, prezzo e categoriaId sono obbligatori.",
    });
    return;
  }
  const parsedPrezzo = parseFloat(prezzo);
  const parsedCategoriaId = parseInt(categoriaId, 10);
  if (isNaN(parsedPrezzo) || isNaN(parsedCategoriaId)) {
    res.status(400).json({ message: "Prezzo o categoriaId non validi." });
    return;
  }
  try {
    const product = await prisma.product.create({
      data: {
        titolo,
        descrizione,
        prezzo: parsedPrezzo,
        immagine,
        stock: stock !== undefined ? parseInt(stock, 10) : 0,
        categoria: {
          connect: { id: parsedCategoriaId },
        },
      },
      include: { categoria: true, varianti: { include: { valori: true } } },
    });

    // Se ci sono varianti, le creiamo
    if (varianti && Array.isArray(varianti) && varianti.length > 0) {
      for (const variantType of varianti) {
        if (variantType.nome) {
          const createdType = await prisma.productVariantType.create({
            data: {
              nome: variantType.nome,
              productId: product.id,
            },
          });

          // Se ci sono valori per questo tipo di variante, li creiamo
          if (
            variantType.valori &&
            Array.isArray(variantType.valori) &&
            variantType.valori.length > 0
          ) {
            for (const variantValue of variantType.valori) {
              if (variantValue.nome) {
                await prisma.productVariantValue.create({
                  data: {
                    nome: variantValue.nome,
                    immagine: variantValue.immagine,
                    typeId: createdType.id,
                  },
                });
              }
            }
          }
        }
      }

      // Recuperiamo il prodotto con le varianti aggiornate
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: { categoria: true, varianti: { include: { valori: true } } },
      });

      res.status(201).json({
        message: "Prodotto creato con successo",
        product: updatedProduct,
      });
      return;
    }

    res.status(201).json({ message: "Prodotto creato con successo", product });
  } catch (error) {
    console.error("Errore nella creazione prodotto:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        res.status(409).json({
          message: `Conflitto: il campo ${
            Array.isArray(error.meta.target)
              ? error.meta.target.join(", ")
              : error.meta.target
          } deve essere univoco.`,
        });
        return;
      }
      if (error.code === "P2003") {
        res.status(400).json({
          message: `ID categoria non valido o non esistente: ${parsedCategoriaId}`,
        });
        return;
      }
      if (error.code === "P2025") {
        res
          .status(404)
          .json({ message: "La categoria specificata non esiste." });
        return;
      }
    }
    res.status(500).json({
      message: "Errore nella creazione del prodotto",
      error: (error as Error).message,
    });
  }
};

// Aggiornare un prodotto esistente (Admin only - protetto da middleware)
export const updateProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { id } = req.params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  const {
    titolo,
    descrizione,
    prezzo,
    immagine,
    categoriaId,
    stock,
    varianti,
  } = req.body;
  try {
    const dataToUpdate: any = {};
    if (titolo !== undefined) dataToUpdate.titolo = titolo;
    if (descrizione !== undefined) dataToUpdate.descrizione = descrizione;
    if (prezzo !== undefined) dataToUpdate.prezzo = parseFloat(prezzo);
    if (immagine !== undefined) dataToUpdate.immagine = immagine;
    if (categoriaId !== undefined) {
      const parsedCategoriaId = parseInt(categoriaId, 10);
      if (isNaN(parsedCategoriaId)) {
        res.status(400).json({ message: "ID categoria non valido." });
        return;
      }
      dataToUpdate.categoria = { set: [{ id: parsedCategoriaId }] };
    }
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock, 10);
    const product = await prisma.product.update({
      where: { id: productId },
      data: dataToUpdate,
      include: { categoria: true, varianti: { include: { valori: true } } },
    });

    // Gestione delle varianti
    if (varianti && Array.isArray(varianti)) {
      // Otteniamo tutte le varianti esistenti per questo prodotto
      const existingVariantTypes = await prisma.productVariantType.findMany({
        where: { productId },
        include: { valori: true },
      });

      // Per ogni tipo di variante nella richiesta
      for (const variantType of varianti) {
        if (variantType.id) {
          // Aggiornamento di un tipo di variante esistente
          await prisma.productVariantType.update({
            where: { id: variantType.id },
            data: { nome: variantType.nome },
          });

          // Gestione dei valori per questo tipo di variante
          if (variantType.valori && Array.isArray(variantType.valori)) {
            for (const variantValue of variantType.valori) {
              if (variantValue.id) {
                // Aggiornamento di un valore esistente
                await prisma.productVariantValue.update({
                  where: { id: variantValue.id },
                  data: {
                    nome: variantValue.nome,
                    immagine: variantValue.immagine,
                  },
                });
              } else if (variantValue.nome) {
                // Creazione di un nuovo valore
                await prisma.productVariantValue.create({
                  data: {
                    nome: variantValue.nome,
                    immagine: variantValue.immagine,
                    typeId: variantType.id,
                  },
                });
              }
            }
            // Rimozione dei valori che non sono più presenti
            const valueIdsToKeep = variantType.valori
              .filter((v: any) => v.id)
              .map((v: any) => v.id);

            if (valueIdsToKeep.length > 0) {
              await prisma.productVariantValue.deleteMany({
                where: {
                  typeId: variantType.id,
                  id: { notIn: valueIdsToKeep },
                },
              });
            }
          }
        } else if (variantType.nome) {
          // Creazione di un nuovo tipo di variante
          const newType = await prisma.productVariantType.create({
            data: {
              nome: variantType.nome,
              productId,
            },
          });

          // Creazione dei valori per questo nuovo tipo
          if (variantType.valori && Array.isArray(variantType.valori)) {
            for (const variantValue of variantType.valori) {
              if (variantValue.nome) {
                await prisma.productVariantValue.create({
                  data: {
                    nome: variantValue.nome,
                    immagine: variantValue.immagine,
                    typeId: newType.id,
                  },
                });
              }
            }
          }
        }
      }

      // Rimuoviamo i tipi di variante che non sono più presenti
      const typeIdsToKeep = varianti.filter((t) => t.id).map((t) => t.id);

      if (typeIdsToKeep.length > 0 || existingVariantTypes.length > 0) {
        // Prima rimuoviamo tutti i valori per i tipi da eliminare
        await prisma.productVariantValue.deleteMany({
          where: {
            typeId: {
              in: existingVariantTypes
                .filter((t: any) => !typeIdsToKeep.includes(t.id))
                .map((t: any) => t.id),
            },
          },
        });

        // Poi rimuoviamo i tipi
        if (existingVariantTypes.length > 0) {
          await prisma.productVariantType.deleteMany({
            where: {
              productId,
              id: {
                notIn: typeIdsToKeep.length > 0 ? typeIdsToKeep : [-1],
              },
            },
          });
        }
      }

      // Recuperiamo il prodotto aggiornato con tutte le varianti
      const updatedProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { categoria: true, varianti: { include: { valori: true } } },
      });

      res.json({
        message: "Prodotto aggiornato con successo",
        product: updatedProduct,
      });
      return;
    }

    res.json({ message: "Prodotto aggiornato con successo", product });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        res.status(409).json({
          message: `Conflitto: il campo ${
            Array.isArray(error.meta.target)
              ? error.meta.target.join(", ")
              : error.meta.target
          } deve essere univoco.`,
        });
        return;
      }
      if (error.code === "P2003" && categoriaId) {
        res.status(400).json({
          message: `ID categoria non valido o non esistente: ${categoriaId}`,
        });
        return;
      }
      if (error.code === "P2025") {
        res.status(404).json({
          message: "Prodotto o categoria non trovato/a per l'aggiornamento",
        });
        return;
      }
    }
    res.status(500).json({
      message: "Errore nell'aggiornamento del prodotto",
      error: (error as Error).message,
    });
  }
};

// Eliminare un prodotto (Admin only - protetto da middleware)
export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    } // Eliminazione in cascata: prima i record collegati, poi le varianti, poi il prodotto
    // 1. Elimina tutti i CartItem che fanno riferimento a questo prodotto
    await prisma.cartItem.deleteMany({
      where: { productId: productId },
    });

    // 2. IMPORTANTE: NON eliminare OrderItem - mantieni integrità storica ordini
    // Gli OrderItem devono rimanere per mantenere lo storico degli ordini
    // Verifica se ci sono OrderItem collegati
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: productId },
    });

    if (orderItemsCount > 0) {
      res.status(409).json({
        message:
          "Impossibile eliminare il prodotto. È presente in ordini esistenti. Per motivi di conformità fiscale e storico vendite, i prodotti ordinati non possono essere eliminati.",
        orderItemsCount,
      });
      return;
    }

    // 3. Elimina tutti i valori delle varianti associate al prodotto
    await prisma.productVariantValue.deleteMany({
      where: {
        type: {
          productId: productId,
        },
      },
    });

    // 4. Elimina tutti i tipi di varianti del prodotto
    await prisma.productVariantType.deleteMany({
      where: { productId: productId },
    });

    // 5. Ora possiamo eliminare il prodotto in sicurezza
    await prisma.product.delete({ where: { id: productId } });

    res.json({ message: "Prodotto eliminato con successo" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res
          .status(404)
          .json({ message: "Prodotto non trovato per l'eliminazione" });
        return;
      }
      if (error.code === "P2014") {
        res.status(409).json({
          message:
            "Impossibile eliminare il prodotto. Esistono record correlati (es. ordini, carrelli) che lo referenziano.",
        });
        return;
      }
    }
    res.status(500).json({
      message: "Errore nell'eliminazione del prodotto",
      error: (error as Error).message,
    });
  }
};
