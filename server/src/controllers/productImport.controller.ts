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
        let fileContent = fs.readFileSync(file.path, "utf8");
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
          const {
            codiceProdotto,
            codiceEAN,
            titolo,
            immagine,
            url,
            stock,
            descrizione,
            descrizioneBreve,
            stato,
            prezzo,
            categoriaId,
          } = {
            codiceProdotto: row["CODICE PRODOTTO"] || row["codiceProdotto"],
            codiceEAN: row["CODICE EAN"] || row["codiceEAN"],
            titolo: row["TITOLO"] || row["titolo"],
            immagine: row["IMMAGINE"] || row["immagine"],
            url: row["URL"] || row["url"],
            stock: row["STOCK"] || row["stock"],
            descrizione: row["DESCRIZIONE"] || row["descrizione"],
            descrizioneBreve:
              row["DESCRIZIONE BREVE"] || row["descrizioneBreve"],
            stato: row["STATO"] || row["stato"],
            prezzo: row["prezzo"] || row["PREZZO"],
            categoriaId:
              row["CATEGORIA"] || row["categoriaId"] || row["categoria"],
          };
          // Gestione categoria: accetta sia id che nome, crea se non esiste
          let categoriaIdNum: number | undefined = undefined;
          if (categoriaId && !isNaN(Number(categoriaId))) {
            categoriaIdNum = Number(categoriaId);
          } else if (categoriaId && typeof categoriaId === "string") {
            // Cerca la categoria per nome (case-insensitive)
            let categoria = await prisma.category.findFirst({
              where: {
                name: { equals: categoriaId.trim(), mode: "insensitive" },
              },
            });
            if (!categoria) {
              categoria = await prisma.category.create({
                data: { name: categoriaId.trim() },
              });
            }
            categoriaIdNum = categoria.id;
          }
          const missingFields = [];
          if (!codiceProdotto) missingFields.push("codiceProdotto");
          if (!titolo) missingFields.push("titolo");
          if (!prezzo) missingFields.push("prezzo");
          if (!stock) missingFields.push("stock");
          if (!categoriaIdNum) missingFields.push("categoriaId");
          if (missingFields.length > 0) {
            errors.push({
              codiceProdotto,
              error: `Campi obbligatori mancanti o non validi: ${missingFields.join(
                ", "
              )}`,
            });
            continue;
          }
          try {
            const existing = await prisma.product.findUnique({
              where: { codiceProdotto },
            });
            if (existing) {
              await prisma.product.update({
                where: { codiceProdotto },
                data: {
                  codiceEAN,
                  titolo,
                  immagine,
                  url,
                  stock: Number(stock),
                  descrizione,
                  descrizioneBreve,
                  stato,
                  prezzo: Number(prezzo),
                  categoria: { set: [{ id: categoriaIdNum }] },
                },
              });
              updated++;
            } else {
              await prisma.product.create({
                data: {
                  codiceProdotto,
                  codiceEAN,
                  titolo,
                  immagine,
                  url,
                  stock: Number(stock),
                  descrizione,
                  descrizioneBreve,
                  stato,
                  prezzo: Number(prezzo),
                  categoria: { connect: [{ id: categoriaIdNum }] },
                },
              });
              created++;
            }
          } catch (err) {
            errors.push({ codiceProdotto, error: (err as Error).message });
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
        const workbook = XLSX.readFile(file.path);
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
          const {
            codiceProdotto,
            codiceEAN,
            titolo,
            immagine,
            url,
            stock,
            descrizione,
            descrizioneBreve,
            stato,
            prezzo,
            categoriaId,
          } = {
            codiceProdotto:
              rowObj["CODICE PRODOTTO"] || rowObj["codiceProdotto"],
            codiceEAN: rowObj["CODICE EAN"] || rowObj["codiceEAN"],
            titolo: rowObj["TITOLO"] || rowObj["titolo"],
            immagine: rowObj["IMMAGINE"] || rowObj["immagine"],
            url: rowObj["URL"] || rowObj["url"],
            stock: rowObj["STOCK"] || rowObj["stock"],
            descrizione: rowObj["DESCRIZIONE"] || rowObj["descrizione"],
            descrizioneBreve:
              rowObj["DESCRIZIONE BREVE"] || rowObj["descrizioneBreve"],
            stato: rowObj["STATO"] || rowObj["stato"],
            prezzo: rowObj["prezzo"] || rowObj["PREZZO"],
            categoriaId:
              rowObj["CATEGORIA"] ||
              rowObj["categoriaId"] ||
              rowObj["categoria"],
          };

          // Gestione categoria anche per Excel: accetta sia id che nome, crea se non esiste
          let categoriaIdNum: number | undefined = undefined;
          if (categoriaId && !isNaN(Number(categoriaId))) {
            categoriaIdNum = Number(categoriaId);
          } else if (categoriaId && typeof categoriaId === "string") {
            let categoria = await prisma.category.findFirst({
              where: {
                name: { equals: categoriaId.trim(), mode: "insensitive" },
              },
            });
            if (!categoria) {
              categoria = await prisma.category.create({
                data: { name: categoriaId.trim() },
              });
            }
            categoriaIdNum = categoria.id;
          }
          const missingFields = [];
          if (!codiceProdotto) missingFields.push("codiceProdotto");
          if (!titolo) missingFields.push("titolo");
          if (!prezzo) missingFields.push("prezzo");
          if (!stock) missingFields.push("stock");
          if (!categoriaIdNum) missingFields.push("categoriaId");
          if (missingFields.length > 0) {
            errors.push({
              codiceProdotto,
              error: `Campi obbligatori mancanti o non validi: ${missingFields.join(
                ", "
              )}`,
            });
            continue;
          }
          try {
            const existing = await prisma.product.findUnique({
              where: { codiceProdotto },
            });
            if (existing) {
              await prisma.product.update({
                where: { codiceProdotto },
                data: {
                  codiceEAN,
                  titolo,
                  immagine,
                  url,
                  stock: Number(stock),
                  descrizione,
                  descrizioneBreve,
                  stato,
                  prezzo: Number(prezzo),
                  categoria: { set: [{ id: categoriaIdNum }] },
                },
              });
              updated++;
            } else {
              await prisma.product.create({
                data: {
                  codiceProdotto,
                  codiceEAN,
                  titolo,
                  immagine,
                  url,
                  stock: Number(stock),
                  descrizione,
                  descrizioneBreve,
                  stato,
                  prezzo: Number(prezzo),
                  categoria: { connect: [{ id: categoriaIdNum }] },
                },
              });
              created++;
            }
          } catch (err) {
            errors.push({ codiceProdotto, error: (err as Error).message });
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
