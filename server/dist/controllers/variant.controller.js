"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVariantValueImage = exports.deleteVariantValue = exports.updateVariantValue = exports.createVariantValue = exports.deleteVariantType = exports.updateVariantType = exports.createVariantType = exports.getVariantTypes = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const streamifier_1 = __importDefault(require("streamifier"));
const prisma = new client_1.PrismaClient();
// Ottenere tutti i tipi di variante per un prodotto
const getVariantTypes = async (req, res) => {
    const { productId } = req.params;
    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
        res.status(400).json({ message: "ID prodotto non valido" });
        return;
    }
    try {
        const variantTypes = await prisma.productVariantType.findMany({
            where: { productId: parsedProductId },
            include: { valori: true },
        });
        res.json(variantTypes);
    }
    catch (error) {
        res.status(500).json({
            message: "Errore nel recupero dei tipi di variante",
            error: error.message,
        });
    }
};
exports.getVariantTypes = getVariantTypes;
// Creare un nuovo tipo di variante
const createVariantType = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { productId } = req.params;
    const { nome } = req.body;
    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
        res.status(400).json({ message: "ID prodotto non valido" });
        return;
    }
    if (!nome) {
        res
            .status(400)
            .json({ message: "Il nome del tipo di variante è obbligatorio" });
        return;
    }
    try {
        // Verifica che il prodotto esista
        const product = await prisma.product.findUnique({
            where: { id: parsedProductId },
        });
        if (!product) {
            res.status(404).json({ message: "Prodotto non trovato" });
            return;
        }
        const variantType = await prisma.productVariantType.create({
            data: {
                nome,
                productId: parsedProductId,
            },
            include: { valori: true },
        });
        res.status(201).json({
            message: "Tipo di variante creato con successo",
            variantType,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Errore nella creazione del tipo di variante",
            error: error.message,
        });
    }
};
exports.createVariantType = createVariantType;
// Aggiornare un tipo di variante
const updateVariantType = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { id } = req.params;
    const { nome } = req.body;
    const variantTypeId = parseInt(id, 10);
    if (isNaN(variantTypeId)) {
        res.status(400).json({ message: "ID tipo di variante non valido" });
        return;
    }
    if (!nome) {
        res
            .status(400)
            .json({ message: "Il nome del tipo di variante è obbligatorio" });
        return;
    }
    try {
        const variantType = await prisma.productVariantType.update({
            where: { id: variantTypeId },
            data: { nome },
            include: { valori: true },
        });
        res.json({
            message: "Tipo di variante aggiornato con successo",
            variantType,
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({ message: "Tipo di variante non trovato" });
                return;
            }
        }
        res.status(500).json({
            message: "Errore nell'aggiornamento del tipo di variante",
            error: error.message,
        });
    }
};
exports.updateVariantType = updateVariantType;
// Eliminare un tipo di variante
const deleteVariantType = async (req, res) => {
    const { id } = req.params;
    const variantTypeId = parseInt(id, 10);
    if (isNaN(variantTypeId)) {
        res.status(400).json({ message: "ID tipo di variante non valido" });
        return;
    }
    try {
        // Prima eliminiamo tutti i valori di variante associati
        await prisma.productVariantValue.deleteMany({
            where: { typeId: variantTypeId },
        });
        // Poi eliminiamo il tipo di variante
        await prisma.productVariantType.delete({
            where: { id: variantTypeId },
        });
        res.json({ message: "Tipo di variante eliminato con successo" });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({ message: "Tipo di variante non trovato" });
                return;
            }
        }
        res.status(500).json({
            message: "Errore nell'eliminazione del tipo di variante",
            error: error.message,
        });
    }
};
exports.deleteVariantType = deleteVariantType;
// Creare un nuovo valore di variante
const createVariantValue = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { typeId } = req.params;
    const { nome, immagine } = req.body;
    const parsedTypeId = parseInt(typeId, 10);
    if (isNaN(parsedTypeId)) {
        res.status(400).json({ message: "ID tipo di variante non valido" });
        return;
    }
    if (!nome) {
        res
            .status(400)
            .json({ message: "Il nome del valore di variante è obbligatorio" });
        return;
    }
    try {
        // Verifica che il tipo di variante esista
        const variantType = await prisma.productVariantType.findUnique({
            where: { id: parsedTypeId },
        });
        if (!variantType) {
            res.status(404).json({ message: "Tipo di variante non trovato" });
            return;
        }
        const variantValue = await prisma.productVariantValue.create({
            data: {
                nome,
                immagine,
                typeId: parsedTypeId,
            },
        });
        res.status(201).json({
            message: "Valore di variante creato con successo",
            variantValue,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Errore nella creazione del valore di variante",
            error: error.message,
        });
    }
};
exports.createVariantValue = createVariantValue;
// Aggiornare un valore di variante
const updateVariantValue = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { id } = req.params;
    const { nome, immagine } = req.body;
    const variantValueId = parseInt(id, 10);
    if (isNaN(variantValueId)) {
        res.status(400).json({ message: "ID valore di variante non valido" });
        return;
    }
    if (!nome) {
        res
            .status(400)
            .json({ message: "Il nome del valore di variante è obbligatorio" });
        return;
    }
    try {
        const variantValue = await prisma.productVariantValue.update({
            where: { id: variantValueId },
            data: { nome, immagine },
        });
        res.json({
            message: "Valore di variante aggiornato con successo",
            variantValue,
        });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({ message: "Valore di variante non trovato" });
                return;
            }
        }
        res.status(500).json({
            message: "Errore nell'aggiornamento del valore di variante",
            error: error.message,
        });
    }
};
exports.updateVariantValue = updateVariantValue;
// Eliminare un valore di variante
const deleteVariantValue = async (req, res) => {
    const { id } = req.params;
    const variantValueId = parseInt(id, 10);
    if (isNaN(variantValueId)) {
        res.status(400).json({ message: "ID valore di variante non valido" });
        return;
    }
    try {
        await prisma.productVariantValue.delete({
            where: { id: variantValueId },
        });
        res.json({ message: "Valore di variante eliminato con successo" });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res.status(404).json({ message: "Valore di variante non trovato" });
                return;
            }
        }
        res.status(500).json({
            message: "Errore nell'eliminazione del valore di variante",
            error: error.message,
        });
    }
};
exports.deleteVariantValue = deleteVariantValue;
// Caricare un'immagine per un valore di variante
const uploadVariantValueImage = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "Nessun file inviato." });
        return;
    }
    try {
        const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({ folder: "bambu-ecomm/variants" }, (error, result) => {
                if (error || !result) {
                    reject(error || new Error("Errore upload Cloudinary"));
                    return;
                }
                resolve(result.secure_url);
            });
            streamifier_1.default.createReadStream(req.file.buffer).pipe(stream);
        });
        const imageUrl = await uploadPromise;
        res.json({ url: imageUrl });
    }
    catch (error) {
        res.status(500).json({
            message: "Errore nell'upload dell'immagine",
            error: error.message,
        });
    }
};
exports.uploadVariantValueImage = uploadVariantValueImage;
