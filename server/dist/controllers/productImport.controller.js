"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelImportJob = exports.getActiveImportJob = exports.getImportStatus = exports.importProducts = void 0;
const client_1 = require("@prisma/client");
const XLSX = __importStar(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const sync_1 = require("csv-parse/sync");
const uuid_1 = require("uuid");
const prisma = new client_1.PrismaClient();
// Stato in memoria dei job di importazione
const importJobStatus = {};
// Endpoint: POST /api/products/import
// Riceve un file Excel, aggiorna o crea prodotti in base a codiceProdotto
const importProducts = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "Nessun file caricato." });
        return;
    }
    // PRIMA di accettare un nuovo job, controlla se ce n'è già uno attivo (pending/processing)
    const activeJobId = Object.entries(importJobStatus).find(([, v]) => v.status === "pending" || v.status === "processing")?.[0];
    if (activeJobId) {
        res.json({ jobId: activeJobId, alreadyActive: true });
        return;
    }
    // Genera un jobId e restituiscilo subito
    const jobId = (0, uuid_1.v4)();
    importJobStatus[jobId] = { progress: 0, status: "pending" };
    res.json({ jobId });
    // Esegui l'import in background
    (async () => {
        try {
            const file = req.file;
            importJobStatus[jobId].status = "processing";
            let created = 0;
            let updated = 0;
            let errors = [];
            let totalRows = 0;
            // CSV: leggi tutto in memoria (già riga per riga)
            if (file.originalname.endsWith(".csv")) {
                let fileContent = file.buffer.toString("utf8");
                const delimiter = fileContent.includes(";") ? ";" : ",";
                let rowsRaw = (0, sync_1.parse)(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    delimiter,
                    trim: true,
                });
                totalRows = rowsRaw.length;
                for (let i = 0; i < rowsRaw.length; i++) {
                    const currentStatus = importJobStatus[jobId].status;
                    if (currentStatus === "cancelled")
                        break;
                    const row = rowsRaw[i];
                    const { titolo, immagine, descrizione, prezzo, categoriaId } = {
                        titolo: row["TITOLO"] || row["titolo"],
                        immagine: row["IMMAGINE"] || row["immagine"],
                        descrizione: row["DESCRIZIONE"] || row["descrizione"],
                        prezzo: row["prezzo"] || row["PREZZO"],
                        categoriaId: row["CATEGORIA"] || row["categoriaId"] || row["categoria"],
                    };
                    // Gestione categoria e sottocategoria anche per CSV: supporta "Categoria|Sottocategoria"
                    let categoriaIdNum = undefined;
                    let subcategoryIdNum = undefined;
                    let categoriaNome = categoriaId;
                    let subcategoriaNome = undefined;
                    if (typeof categoriaId === "string" && categoriaId.includes("|")) {
                        const [cat, subcat] = categoriaId
                            .split("|")
                            .map((s) => s.trim());
                        categoriaNome = cat;
                        subcategoriaNome = subcat;
                    }
                    // Trova o crea la categoria principale
                    if (categoriaNome && !isNaN(Number(categoriaNome))) {
                        categoriaIdNum = Number(categoriaNome);
                    }
                    else if (categoriaNome && typeof categoriaNome === "string") {
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
                    if (!titolo)
                        missingFields.push("titolo");
                    if (!prezzo)
                        missingFields.push("prezzo");
                    if (!categoryToConnect)
                        missingFields.push("categoriaId");
                    if (missingFields.length > 0) {
                        errors.push({
                            error: `Campi obbligatori mancanti o non validi: ${missingFields.join(", ")}`,
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
                        }
                        else {
                            await prisma.product.create({
                                data: {
                                    titolo,
                                    immagine,
                                    descrizione,
                                    prezzo: Number(prezzo),
                                    categoria: { connect: [{ id: categoryToConnect }] },
                                }, // workaround for lingering type error from old generated types
                            });
                            created++;
                        }
                    }
                    catch (err) {
                        errors.push({ error: err.message });
                    }
                    importJobStatus[jobId].progress = Math.round(((i + 1) / totalRows) * 100);
                    importJobStatus[jobId].currentRow = i;
                    importJobStatus[jobId].totalRows = totalRows;
                    importJobStatus[jobId].created = created;
                    importJobStatus[jobId].updated = updated;
                    importJobStatus[jobId].errors = errors;
                }
            }
            else {
                // Excel: processa riga per riga senza caricare tutto in memoria
                const workbook = XLSX.read(file.buffer, { type: "buffer" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const range = XLSX.utils.decode_range(sheet["!ref"]);
                totalRows = range.e.r - range.s.r; // Esclude header
                for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
                    const currentStatus = importJobStatus[jobId].status;
                    if (currentStatus === "cancelled")
                        break;
                    const rowObj = {};
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
                        categoriaId: rowObj["CATEGORIA"] ||
                            rowObj["categoriaId"] ||
                            rowObj["categoria"],
                    };
                    // Gestione categoria e sottocategoria per Excel: supporta "Categoria|Sottocategoria"
                    let categoriaIdNum = undefined;
                    let subcategoryIdNum = undefined;
                    let categoriaNome = categoriaId;
                    let subcategoriaNome = undefined;
                    if (typeof categoriaId === "string" && categoriaId.includes("|")) {
                        const [cat, subcat] = categoriaId
                            .split("|")
                            .map((s) => s.trim());
                        categoriaNome = cat;
                        subcategoriaNome = subcat;
                    }
                    // Trova o crea la categoria principale
                    if (categoriaNome && !isNaN(Number(categoriaNome))) {
                        categoriaIdNum = Number(categoriaNome);
                    }
                    else if (categoriaNome && typeof categoriaNome === "string") {
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
                    if (!titolo)
                        missingFields.push("titolo");
                    if (!prezzo)
                        missingFields.push("prezzo");
                    if (!categoryToConnect)
                        missingFields.push("categoriaId");
                    if (missingFields.length > 0) {
                        errors.push({
                            error: `Campi obbligatori mancanti o non validi: ${missingFields.join(", ")}`,
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
                        }
                        else {
                            await prisma.product.create({
                                data: {
                                    titolo,
                                    immagine,
                                    descrizione,
                                    prezzo: Number(prezzo),
                                    categoria: { connect: [{ id: categoryToConnect }] },
                                }, // workaround for lingering type error from old generated types
                            });
                            created++;
                        }
                    }
                    catch (err) {
                        errors.push({ error: err.message });
                    }
                    importJobStatus[jobId].progress = Math.round(((rowNum - range.s.r) / totalRows) * 100);
                    importJobStatus[jobId].currentRow = rowNum - range.s.r - 1;
                    importJobStatus[jobId].totalRows = totalRows;
                    importJobStatus[jobId].created = created;
                    importJobStatus[jobId].updated = updated;
                    importJobStatus[jobId].errors = errors;
                }
            }
            fs_1.default.unlinkSync(file.path);
            if (importJobStatus[jobId].status === "cancelled") {
                importJobStatus[jobId] = {
                    progress: importJobStatus[jobId].progress,
                    status: "cancelled",
                    created,
                    updated,
                    errors,
                    message: "Importazione interrotta dall'utente.",
                };
            }
            else {
                importJobStatus[jobId] = {
                    progress: 100,
                    status: "done",
                    created,
                    updated,
                    errors,
                };
            }
        }
        catch (error) {
            importJobStatus[jobId] = {
                progress: 100,
                status: "error",
                message: error.message,
            };
        }
    })();
};
exports.importProducts = importProducts;
// Endpoint: GET /api/products/import/status?jobId=...
const getImportStatus = (req, res) => {
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
exports.getImportStatus = getImportStatus;
// Endpoint: GET /api/products/import/active
const getActiveImportJob = (req, res) => {
    const activeEntry = Object.entries(importJobStatus).find(([, v]) => v.status === "pending" || v.status === "processing");
    if (!activeEntry) {
        res.json({ active: false });
        return;
    }
    const [jobId, status] = activeEntry;
    res.json({ active: true, jobId, status });
};
exports.getActiveImportJob = getActiveImportJob;
// Endpoint: POST /api/products/import/cancel
const cancelImportJob = (req, res) => {
    const { jobId } = req.body;
    if (!jobId || typeof jobId !== "string") {
        res.status(400).json({ message: "jobId mancante" });
        return;
    }
    if (!importJobStatus[jobId]) {
        res.status(404).json({ message: "Job non trovato" });
        return;
    }
    if (importJobStatus[jobId].status !== "processing" &&
        importJobStatus[jobId].status !== "pending") {
        res.status(400).json({ message: "Job non annullabile" });
        return;
    }
    importJobStatus[jobId].status = "cancelled";
    res.json({ message: "Job annullato" });
};
exports.cancelImportJob = cancelImportJob;
