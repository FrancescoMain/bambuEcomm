import { Request, Response } from "express";
import { OrderStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { activeDiscountWhere } from "../lib/pricing";

// Stati che contano come vendita (pagati o da evadere)
const SOLD: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalOrders,
      newOrdersToday,
      toShip,
      shippedToday,
      totalCustomers,
      newCustomersThisWeek,
      totalProducts,
      unavailableProducts,
      onSaleProducts,
      revenueThisMonth,
      revenuePrevMonth,
      monthly,
      topProducts,
      recentOrders,
      unreadMessages,
      pendingReviews,
      pendingWithdrawals,
      stockAlerts,
      newsletterSubscribers,
    ] = await Promise.all([
      prisma.order.count({ where: { status: { in: SOLD } } }),
      prisma.order.count({ where: { createdAt: { gte: today }, status: { in: SOLD } } }),
      prisma.order.count({ where: { status: { in: [OrderStatus.PENDING, OrderStatus.PROCESSING] } } }),
      prisma.order.count({ where: { status: OrderStatus.SHIPPED, updatedAt: { gte: today } } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.product.count(),
      prisma.product.count({ where: { available: false } }),
      prisma.product.count({ where: activeDiscountWhere(now) }),
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart }, status: { in: SOLD } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: prevMonthStart, lt: monthStart }, status: { in: SOLD } },
        _sum: { totalAmount: true },
      }),
      // Vendite per mese degli ultimi 12 mesi in un'unica query
      prisma.$queryRaw<{ month: Date; orders: bigint; revenue: Prisma.Decimal | null }[]>`
        SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::bigint AS orders, SUM("totalAmount") AS revenue
        FROM "Order"
        WHERE "createdAt" >= ${yearAgo} AND status::text IN (${Prisma.join(SOLD)})
        GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw<{ productId: number; titolo: string; sold: bigint; revenue: Prisma.Decimal | null }[]>`
        SELECT oi."productId", p.titolo, SUM(oi.quantity)::bigint AS sold,
               SUM(oi.quantity * oi."priceAtPurchase") AS revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "Product" p ON p.id = oi."productId"
        WHERE o.status::text IN (${Prisma.join(SOLD)})
        GROUP BY oi."productId", p.titolo
        ORDER BY sold DESC LIMIT 5`,
      prisma.order.findMany({
        where: { status: { not: OrderStatus.AWAITING_PAYMENT } },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          totalAmount: true,
          nome: true,
          cognome: true,
          metodoConsegna: true,
          user: { select: { name: true } },
        },
      }),
      prisma.contactMessage.count({ where: { letto: false } }),
      prisma.review.count({ where: { approvata: false } }),
      prisma.withdrawalRequest.count({ where: { stato: "ricevuta" } }),
      prisma.stockAlert.count({ where: { notifiedAt: null } }),
      prisma.newsletterSubscriber.count({ where: { attivo: true } }),
    ]);

    const revenue = Number(revenueThisMonth._sum.totalAmount || 0);
    const prevRevenue = Number(revenuePrevMonth._sum.totalAmount || 0);
    const monthlyGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : revenue > 0 ? 100 : 0;

    const byMonth = new Map(
      monthly.map((m) => [`${m.month.getFullYear()}-${m.month.getMonth()}`, m] as const)
    );
    const salesData = Array.from({ length: 12 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + idx, 1);
      const row = byMonth.get(`${d.getFullYear()}-${d.getMonth()}`);
      const value = Number(row?.revenue || 0);
      return {
        month: MONTHS[d.getMonth()],
        vendite: value,
        fatturato: value,
        ordini: Number(row?.orders || 0),
      };
    });

    res.json({
      summary: {
        totalOrders,
        newOrdersToday,
        pendingOrders: toShip,
        shippedToday,
        totalRevenue: Math.round(revenue * 100) / 100,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        totalProducts,
        unavailableProducts,
        onSaleProducts,
        lowStockProducts: unavailableProducts,
        totalCustomers,
        newCustomersThisWeek,
        conversionRate: 0,
        averageOrderValue:
          revenueThisMonth._count._all > 0
            ? Math.round((revenue / revenueThisMonth._count._all) * 100) / 100
            : 0,
      },
      todo: {
        ordiniDaEvadere: toShip,
        messaggiNonLetti: unreadMessages,
        recensioniDaApprovare: pendingReviews,
        recessiDaGestire: pendingWithdrawals,
        richiesteDisponibilita: stockAlerts,
        iscrittiNewsletter: newsletterSubscribers,
      },
      salesData,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        total: Number(o.totalAmount),
        cliente: `${o.nome || ""} ${o.cognome || ""}`.trim() || o.user?.name || "Cliente",
        metodoConsegna: o.metodoConsegna,
      })),
      topProducts: topProducts.map((p) => ({
        id: p.productId,
        name: p.titolo,
        sold: Number(p.sold),
        revenue: Math.round(Number(p.revenue || 0) * 100) / 100,
      })),
    });
  } catch (error) {
    console.error("Errore nel recupero delle statistiche dashboard:", error);
    res.status(500).json({ message: "Errore interno del server nel recupero delle statistiche" });
  }
};
