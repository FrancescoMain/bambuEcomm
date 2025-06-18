import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Stato in memoria dei job di importazione
const importJobStatus: Record<
  string,
  {
    progress: number; // 0-100
    status: "pending" | "processing" | "done" | "error" | "cancelled";
    message?: string;
    created?: number;
    updated?: number;
    errors?: any[];
    currentRow?: number;
    totalRows?: number;
  }
> = {};

// Endpoint: POST /api/products/import
// Riceve un file Excel, aggiorna o crea prodotti in base a codiceProdotto
export const importProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: "Nessun file caricato." });
    return;
  }
  // PRIMA di accettare un nuovo job, controlla se ce n'è già uno attivo (pending/processing)
  const activeJobId = Object.entries(importJobStatus).find(
    ([, v]) => v.status === "pending" || v.status === "processing"
  )?.[0];
  if (activeJobId) {
    res.json({ jobId: activeJobId, alreadyActive: true });
    return;
  }
  // Genera un jobId e restituiscilo subito
  const jobId = uuidv4();
  importJobStatus[jobId] = { progress: 0, status: "pending" };
  res.json({ jobId });

  // Esegui l'import in background
  (async () => {
    try {
      const file = req.file!;
      importJobStatus[jobId].status = "processing";
      let created = 0;
      let updated = 0;
      let errors: any[] = [];
      let totalRows = 0;
      // CSV: leggi tutto in memoria (già riga per riga)
      if (file.originalname.endsWith(".csv")) {
        let fileContent = file.buffer.toString("utf8");
        const delimiter = fileContent.includes(";") ? ";" : ",";
        let rowsRaw = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          delimiter,
          trim: true,
        });
        totalRows = rowsRaw.length;
        for (let i = 0; i < rowsRaw.length; i++) {
          const currentStatus = importJobStatus[jobId].status as string;
          if (currentStatus === "cancelled") break;
          const row = rowsRaw[i];
          const { titolo, immagine, descrizione, prezzo, categoriaId } = {
            titolo: row["TITOLO"] || row["titolo"],
            immagine: row["IMMAGINE"] || row["immagine"],
            descrizione: row["DESCRIZIONE"] || row["descrizione"],
            prezzo: row["prezzo"] || row["PREZZO"],
            categoriaId:
              row["CATEGORIA"] || row["categoriaId"] || row["categoria"],
          };
          // Gestione categoria e sottocategoria anche per CSV: supporta "Categoria|Sottocategoria"
          let categoriaIdNum: number | undefined = undefined;
          let subcategoryIdNum: number | undefined = undefined;
          let categoriaNome = categoriaId;
          let subcategoriaNome: string | undefined = undefined;
          if (typeof categoriaId === "string" && categoriaId.includes("|")) {
            const [cat, subcat] = categoriaId
              .split("|")
              .map((s: string) => s.trim());
            categoriaNome = cat;
            subcategoriaNome = subcat;
          }
          // Trova o crea la categoria principale
          if (categoriaNome && !isNaN(Number(categoriaNome))) {
            categoriaIdNum = Number(categoriaNome);
          } else if (categoriaNome && typeof categoriaNome === "string") {
            let categoria = await prisma.category.findFirst({
              where: {
                name: { equals: categoriaNome.trim(), mode: "insensitive" },
              },
            });
            if (!categoria) {
              categoria = await prisma.category.create({
                data: { name: categoriaNome.trim() },
              });
            }
            categoriaIdNum = categoria.id;
          }
          // Trova o crea la sottocategoria e la collega alla categoria padre
          if (subcategoriaNome) {
            let subcat = await prisma.category.findFirst({
              where: {
                name: { equals: subcategoriaNome, mode: "insensitive" },
                parentId: categoriaIdNum,
              },
            });
            if (!subcat) {
              subcat = await prisma.category.create({
                data: { name: subcategoriaNome, parentId: categoriaIdNum },
              });
            }
            subcategoryIdNum = subcat.id;
          }
          // Per i prodotti, collega la sottocategoria se esiste, altrimenti la categoria principale
          const categoryToConnect = subcategoryIdNum || categoriaIdNum;
          const missingFields = [];
          if (!titolo) missingFields.push("titolo");
          if (!prezzo) missingFields.push("prezzo");
          if (!categoryToConnect) missingFields.push("categoriaId");
          if (missingFields.length > 0) {
            errors.push({
              error: `Campi obbligatori mancanti o non validi: ${missingFields.join(
                ", "
              )}`,
            });
            continue;
          }
          try {
            // Cerca prodotto solo per titolo e categoria (no codiceProdotto)
            const existing = await prisma.product.findFirst({
              where: {
                titolo,
                categoria: { some: { id: categoryToConnect } },
              },
            });
            if (existing) {
              await prisma.product.update({
                where: { id: existing.id },
                data: {
                  titolo,
                  immagine,
                  descrizione,
                  prezzo: Number(prezzo),
                  categoria: { set: [{ id: categoryToConnect }] },
                },
              });
              updated++;
            } else {
              await prisma.product.create({
                data: {
                  titolo,
                  immagine,
                  descrizione,
                  prezzo: Number(prezzo),
                  categoria: { connect: [{ id: categoryToConnect }] },
                } as any, // workaround for lingering type error from old generated types
              });
              created++;
            }
          } catch (err) {
            errors.push({ error: (err as Error).message });
          }
          importJobStatus[jobId].progress = Math.round(
            ((i + 1) / totalRows) * 100
          );
          importJobStatus[jobId].currentRow = i;
          importJobStatus[jobId].totalRows = totalRows;
          importJobStatus[jobId].created = created;
          importJobStatus[jobId].updated = updated;
          importJobStatus[jobId].errors = errors;
        }
      } else {
        // Excel: processa riga per riga senza caricare tutto in memoria
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(sheet["!ref"]!);
        totalRows = range.e.r - range.s.r; // Esclude header
        for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
          const currentStatus = importJobStatus[jobId].status as string;
          if (currentStatus === "cancelled") break;
          const rowObj: any = {};
          for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
            const cellAddress = XLSX.utils.encode_cell({
              r: rowNum,
              c: colNum,
            });
            const headerCell = XLSX.utils.encode_cell({
              r: range.s.r,
              c: colNum,
            });
            const header = sheet[headerCell]?.v;
            rowObj[header] = sheet[cellAddress]?.v;
          }
          const { titolo, immagine, descrizione, prezzo, categoriaId } = {
            titolo: rowObj["TITOLO"] || rowObj["titolo"],
            immagine: rowObj["IMMAGINE"] || rowObj["immagine"],
            descrizione: rowObj["DESCRIZIONE"] || rowObj["descrizione"],
            prezzo: rowObj["prezzo"] || rowObj["PREZZO"],
            categoriaId:
              rowObj["CATEGORIA"] ||
              rowObj["categoriaId"] ||
              rowObj["categoria"],
          };

          // Gestione categoria e sottocategoria per Excel: supporta "Categoria|Sottocategoria"
          let categoriaIdNum: number | undefined = undefined;
          let subcategoryIdNum: number | undefined = undefined;
          let categoriaNome = categoriaId;
          let subcategoriaNome: string | undefined = undefined;
          if (typeof categoriaId === "string" && categoriaId.includes("|")) {
            const [cat, subcat] = categoriaId
              .split("|")
              .map((s: string) => s.trim());
            categoriaNome = cat;
            subcategoriaNome = subcat;
          }
          // Trova o crea la categoria principale
          if (categoriaNome && !isNaN(Number(categoriaNome))) {
            categoriaIdNum = Number(categoriaNome);
          } else if (categoriaNome && typeof categoriaNome === "string") {
            let categoria = await prisma.category.findFirst({
              where: {
                name: { equals: categoriaNome.trim(), mode: "insensitive" },
              },
            });
            if (!categoria) {
              categoria = await prisma.category.create({
                data: { name: categoriaNome.trim() },
              });
            }
            categoriaIdNum = categoria.id;
          }
          // Trova o crea la sottocategoria e la collega alla categoria padre
          if (subcategoriaNome) {
            let subcat = await prisma.category.findFirst({
              where: {
                name: { equals: subcategoriaNome, mode: "insensitive" },
                // Associa la sottocategoria alla categoria padre se hai un campo parentId
                parentId: categoriaIdNum,
              },
            });
            if (!subcat) {
              subcat = await prisma.category.create({
                data: { name: subcategoriaNome, parentId: categoriaIdNum },
              });
            }
            subcategoryIdNum = subcat.id;
          }
          // Per i prodotti, collega la sottocategoria se esiste, altrimenti la categoria principale
          const categoryToConnect = subcategoryIdNum || categoriaIdNum;
          const missingFields = [];
          if (!titolo) missingFields.push("titolo");
          if (!prezzo) missingFields.push("prezzo");
          if (!categoryToConnect) missingFields.push("categoriaId");
          if (missingFields.length > 0) {
            errors.push({
              error: `Campi obbligatori mancanti o non validi: ${missingFields.join(
                ", "
              )}`,
            });
            continue;
          }
          try {
            // Cerca prodotto solo per titolo e categoria (no codiceProdotto)
            const existing = await prisma.product.findFirst({
              where: {
                titolo,
                categoria: { some: { id: categoryToConnect } },
              },
            });
            if (existing) {
              await prisma.product.update({
                where: { id: existing.id },
                data: {
                  titolo,
                  immagine,
                  descrizione,
                  prezzo: Number(prezzo),
                  categoria: { set: [{ id: categoryToConnect }] },
                },
              });
              updated++;
            } else {
              await prisma.product.create({
                data: {
                  titolo,
                  immagine,
                  descrizione,
                  prezzo: Number(prezzo),
                  categoria: { connect: [{ id: categoryToConnect }] },
                } as any, // workaround for lingering type error from old generated types
              });
              created++;
            }
          } catch (err) {
            errors.push({ error: (err as Error).message });
          }
          importJobStatus[jobId].progress = Math.round(
            ((rowNum - range.s.r) / totalRows) * 100
          );
          importJobStatus[jobId].currentRow = rowNum - range.s.r - 1;
          importJobStatus[jobId].totalRows = totalRows;
          importJobStatus[jobId].created = created;
          importJobStatus[jobId].updated = updated;
          importJobStatus[jobId].errors = errors;
        }
      }
      fs.unlinkSync(file.path);
      if ((importJobStatus[jobId].status as string) === "cancelled") {
        importJobStatus[jobId] = {
          progress: importJobStatus[jobId].progress,
          status: "cancelled",
          created,
          updated,
          errors,
          message: "Importazione interrotta dall'utente.",
        };
      } else {
        importJobStatus[jobId] = {
          progress: 100,
          status: "done",
          created,
          updated,
          errors,
        };
      }
    } catch (error) {
      importJobStatus[jobId] = {
        progress: 100,
        status: "error",
        message: (error as Error).message,
      };
    }
  })();
};

// Endpoint: GET /api/products/import/status?jobId=...
export const getImportStatus = (req: Request, res: Response) => {
  const { jobId } = req.query;
  if (!jobId || typeof jobId !== "string") {
    res.status(400).json({ message: "jobId mancante" });
    return;
  }
  const status = importJobStatus[jobId];
  if (!status) {
    res.status(404).json({ message: "Job non trovato" });
    return;
  }
  res.json(status);
};

// Endpoint: GET /api/products/import/active
export const getActiveImportJob = (req: Request, res: Response) => {
  const activeEntry = Object.entries(importJobStatus).find(
    ([, v]) => v.status === "pending" || v.status === "processing"
  );
  if (!activeEntry) {
    res.json({ active: false });
    return;
  }
  const [jobId, status] = activeEntry;
  res.json({ active: true, jobId, status });
};

// Endpoint: POST /api/products/import/cancel
export const cancelImportJob = (req: Request, res: Response) => {
  const { jobId } = req.body;
  if (!jobId || typeof jobId !== "string") {
    res.status(400).json({ message: "jobId mancante" });
    return;
  }
  if (!importJobStatus[jobId]) {
    res.status(404).json({ message: "Job non trovato" });
    return;
  }
  if (
    importJobStatus[jobId].status !== "processing" &&
    importJobStatus[jobId].status !== "pending"
  ) {
    res.status(400).json({ message: "Job non annullabile" });
    return;
  }
  importJobStatus[jobId].status = "cancelled";
  res.json({ message: "Job annullato" });
};
