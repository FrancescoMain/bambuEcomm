"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getAllCategories = void 0;
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const prisma = new client_1.PrismaClient();
// Ottenere tutte le categorie
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { products: true }, // Opzionale: includere i prodotti per ogni categoria
        });
        res.json(categories);
    }
    catch (error) {
        console.error("Errore nel recupero delle categorie:", error);
        res
            .status(500)
            .json({
            message: "Errore nel recupero delle categorie",
            error: error.message,
        });
    }
};
exports.getAllCategories = getAllCategories;
// Ottenere una singola categoria per ID
const getCategoryById = async (req, res) => {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
        res.status(400).json({ message: "ID categoria non valido" });
        return;
    }
    try {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: { products: true }, // Includere i prodotti associati
        });
        if (!category) {
            res.status(404).json({ message: "Categoria non trovata" });
            return;
        }
        res.json(category);
    }
    catch (error) {
        console.error(`Errore nel recupero della categoria ${id}:`, error);
        res
            .status(500)
            .json({
            message: "Errore nel recupero della categoria",
            error: error.message,
        });
    }
};
exports.getCategoryById = getCategoryById;
// Creare una nuova categoria (Admin only)
const createCategory = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { name, description } = req.body;
    if (!name) {
        res
            .status(400)
            .json({ message: "Il nome della categoria è obbligatorio." });
        return;
    }
    try {
        const category = await prisma.category.create({
            data: {
                name,
                description,
            },
        });
        res
            .status(201)
            .json({ message: "Categoria creata con successo", category });
    }
    catch (error) {
        console.error("Errore nella creazione della categoria:", error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002" && error.meta?.target) {
                res
                    .status(409)
                    .json({
                    message: `Conflitto: la categoria con nome '${name}' esiste già.`,
                });
                return;
            }
        }
        res
            .status(500)
            .json({
            message: "Errore nella creazione della categoria",
            error: error.message,
        });
    }
};
exports.createCategory = createCategory;
// Aggiornare una categoria esistente (Admin only)
const updateCategory = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
        res.status(400).json({ message: "ID categoria non valido" });
        return;
    }
    const { name, description } = req.body;
    if (!name && description === undefined) {
        res
            .status(400)
            .json({
            message: "Almeno un campo (nome o descrizione) deve essere fornito per l'aggiornamento.",
        });
        return;
    }
    try {
        const dataToUpdate = {};
        if (name)
            dataToUpdate.name = name;
        if (description !== undefined)
            dataToUpdate.description = description;
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: dataToUpdate,
        });
        res.json({ message: "Categoria aggiornata con successo", category });
    }
    catch (error) {
        console.error(`Errore nell\'aggiornamento della categoria ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002" && error.meta?.target) {
                res
                    .status(409)
                    .json({
                    message: `Conflitto: una categoria con nome '${name}' esiste già.`,
                });
                return;
            }
            if (error.code === "P2025") {
                res
                    .status(404)
                    .json({ message: "Categoria non trovata per l'aggiornamento" });
                return;
            }
        }
        res
            .status(500)
            .json({
            message: "Errore nell'aggiornamento della categoria",
            error: error.message,
        });
    }
};
exports.updateCategory = updateCategory;
// Eliminare una categoria (Admin only)
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
        res.status(400).json({ message: "ID categoria non valido" });
        return;
    }
    try {
        // Opzionale: verificare se la categoria è utilizzata dai prodotti
        const productsInCategory = await prisma.product.count({
            where: { categoria: { some: { id: categoryId } } },
        });
        if (productsInCategory > 0) {
            res.status(409).json({
                message: `Impossibile eliminare la categoria. ${productsInCategory} prodotti sono associati a questa categoria. Dissocia prima i prodotti.`,
            });
            return;
        }
        await prisma.category.delete({ where: { id: categoryId } });
        res.json({ message: "Categoria eliminata con successo" });
    }
    catch (error) {
        console.error(`Errore nell\'eliminazione della categoria ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                res
                    .status(404)
                    .json({ message: "Categoria non trovata per l'eliminazione" });
                return;
            }
        }
        res
            .status(500)
            .json({
            message: "Errore nell'eliminazione della categoria",
            error: error.message,
        });
    }
};
exports.deleteCategory = deleteCategory;
