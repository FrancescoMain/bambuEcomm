"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeekStart = (0, date_fns_1.subDays)(today, 7);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        // 1. Statistiche ordini
        const [totalOrders, newOrdersToday, pendingOrders, shippedToday, totalCustomers, newCustomersThisWeek, totalProducts,] = await Promise.all([
            // Ordini totali
            prisma.order.count(),
            // Ordini di oggi
            prisma.order.count({
                where: {
                    createdAt: {
                        gte: today,
                    },
                },
            }),
            // Ordini in attesa
            prisma.order.count({
                where: {
                    status: {
                        in: [client_1.OrderStatus.PENDING, client_1.OrderStatus.PROCESSING],
                    },
                },
            }),
            // Spediti oggi
            prisma.order.count({
                where: {
                    status: client_1.OrderStatus.SHIPPED,
                    updatedAt: {
                        gte: today,
                    },
                },
            }),
            // Clienti totali
            prisma.user.count(),
            // Nuovi clienti questa settimana
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: thisWeekStart,
                    },
                },
            }),
            // Prodotti totali
            prisma.product.count(),
        ]);
        // 2. Fatturato del mese corrente e precedente
        const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
            prisma.order.aggregate({
                where: {
                    createdAt: {
                        gte: thisMonthStart,
                    },
                    status: {
                        notIn: [client_1.OrderStatus.CANCELLED, client_1.OrderStatus.REFUNDED],
                    },
                },
                _sum: {
                    totalAmount: true,
                },
            }),
            prisma.order.aggregate({
                where: {
                    createdAt: {
                        gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                        lt: thisMonthStart,
                    },
                    status: {
                        notIn: [client_1.OrderStatus.CANCELLED, client_1.OrderStatus.REFUNDED],
                    },
                },
                _sum: {
                    totalAmount: true,
                },
            }),
        ]);
        const totalRevenue = Number(currentMonthRevenue._sum.totalAmount || 0);
        const previousRevenue = Number(previousMonthRevenue._sum.totalAmount || 0);
        const monthlyGrowth = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : totalRevenue > 0 ? 100 : 0;
        // 3. Valore medio ordine
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // 4. Dati vendite ultimi 12 mesi
        const salesData = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const [monthlyOrders, monthlyRevenue] = await Promise.all([
                prisma.order.count({
                    where: {
                        createdAt: {
                            gte: monthStart,
                            lte: monthEnd,
                        },
                        status: {
                            notIn: [client_1.OrderStatus.CANCELLED, client_1.OrderStatus.REFUNDED],
                        },
                    },
                }),
                prisma.order.aggregate({
                    where: {
                        createdAt: {
                            gte: monthStart,
                            lte: monthEnd,
                        },
                        status: {
                            notIn: [client_1.OrderStatus.CANCELLED, client_1.OrderStatus.REFUNDED],
                        },
                    },
                    _sum: {
                        totalAmount: true,
                    },
                }),
            ]);
            salesData.push({
                month: (0, date_fns_1.format)(monthStart, "MMM"),
                vendite: Number(monthlyRevenue._sum.totalAmount || 0),
                ordini: monthlyOrders,
                fatturato: Number(monthlyRevenue._sum.totalAmount || 0),
            });
        }
        // 5. Top prodotti venduti
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
                priceAtPurchase: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: 5,
        });
        const topProductsWithDetails = await Promise.all(topProducts.map(async (item) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { titolo: true },
            });
            return {
                name: product?.titolo || 'Prodotto sconosciuto',
                sold: item._sum.quantity || 0,
                revenue: Number(item._sum.priceAtPurchase || 0),
            };
        }));
        // 6. Attività recenti (ultimi 10 ordini/eventi)
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                createdAt: true,
                user: {
                    select: { name: true },
                },
            },
        });
        const recentActivity = recentOrders.map((order) => {
            const timeAgo = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60));
            let action = '';
            let type = 'order';
            switch (order.status) {
                case client_1.OrderStatus.PENDING:
                    action = `Nuovo ordine #${order.id}`;
                    break;
                case client_1.OrderStatus.SHIPPED:
                    action = `Ordine #${order.id} spedito`;
                    type = 'shipping';
                    break;
                case client_1.OrderStatus.DELIVERED:
                    action = `Ordine #${order.id} consegnato`;
                    type = 'delivery';
                    break;
                default:
                    action = `Ordine #${order.id} aggiornato`;
            }
            return {
                time: timeAgo < 60 ? `${timeAgo} min fa` : `${Math.floor(timeAgo / 60)}h fa`,
                action,
                type,
                urgent: false,
            };
        });
        // 7. Distribuzione per categoria (mock per ora, da implementare se abbiamo categorie)
        const categoryData = [
            { name: "Quaderni e Agende", value: 35, color: "#51946b" },
            { name: "Penne e Matite", value: 25, color: "#3d7a57" },
            { name: "Cartoleria Creativa", value: 20, color: "#7db892" },
            { name: "Zaini e Astucci", value: 15, color: "#a5c9b0" },
            { name: "Altri", value: 5, color: "#c2d6c7" },
        ];
        const dashboardData = {
            summary: {
                totalOrders,
                newOrdersToday,
                pendingOrders,
                shippedToday,
                totalRevenue: Math.round(totalRevenue),
                monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
                totalProducts,
                lowStockProducts: 0, // Da implementare se abbiamo stock tracking
                totalCustomers,
                newCustomersThisWeek,
                conversionRate: 0, // Da calcolare se abbiamo analytics
                averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            },
            salesData,
            categoryData, // Mock per ora
            recentActivity,
            topProducts: topProductsWithDetails,
        };
        res.json(dashboardData);
    }
    catch (error) {
        console.error("Errore nel recupero delle statistiche dashboard:", error);
        res.status(500).json({
            message: "Errore interno del server nel recupero delle statistiche"
        });
    }
};
exports.getDashboardStats = getDashboardStats;
