import { Request, Response } from "express";
import emailService from "../services/emailService";

/**
 * Controller per testare il servizio email
 */
export const testEmailService = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type } = req.body;

    let result = false;
    let message = "";

    switch (type) {
      case "welcome":
        result = await emailService.sendWelcomeEmail({
          name: "Test User",
          email: "test@example.com",
        });
        message = "Email di benvenuto inviata";
        break;

      case "password-reset":
        result = await emailService.sendPasswordResetEmail({
          name: "Test User",
          email: "test@example.com",
          resetToken: "test-token-123",
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=test-token-123`,
        });
        message = "Email reset password inviata";
        break;

      case "newsletter":
        result = await emailService.sendNewsletterConfirmationEmail({
          email: "test@example.com",
        });
        message = "Email conferma newsletter inviata";
        break;

      case "order-confirmation":
        result = await emailService.sendOrderConfirmationEmail({
          orderId: "TEST-001",
          customerName: "Test Customer",
          customerEmail: "test@example.com",
          items: [
            { name: "Quaderno A4", quantity: 2, price: 5.99 },
            { name: "Penna Blu", quantity: 1, price: 1.5 },
          ],
          total: 13.48,
          orderDate: new Date().toLocaleDateString("it-IT"),
        });
        message = "Email conferma ordine inviata";
        break;

      case "order-admin":
        result = await emailService.sendOrderNotificationToAdmin({
          orderId: "TEST-001",
          customerName: "Test Customer",
          customerEmail: "test@example.com",
          items: [
            { name: "Quaderno A4", quantity: 2, price: 5.99 },
            { name: "Penna Blu", quantity: 1, price: 1.5 },
          ],
          total: 13.48,
          orderDate: new Date().toLocaleDateString("it-IT"),
        });
        message = "Email notifica ordine admin inviata";
        break;

      case "order-shipped":
        result = await emailService.sendOrderShippedEmail({
          orderId: "TEST-001",
          customerName: "Test Customer",
          customerEmail: "test@example.com",
          items: [{ name: "Quaderno A4", quantity: 2, price: 5.99 }],
          total: 11.98,
          orderDate: new Date().toLocaleDateString("it-IT"),
          trackingNumber: "TR123456789IT",
        });
        message = "Email ordine spedito inviata";
        break;

      case "order-cancelled":
        result = await emailService.sendOrderCancelledEmail({
          orderId: "TEST-001",
          customerName: "Test Customer",
          customerEmail: "test@example.com",
          items: [{ name: "Quaderno A4", quantity: 2, price: 5.99 }],
          total: 11.98,
          orderDate: new Date().toLocaleDateString("it-IT"),
          cancelReason: "Prodotto non disponibile",
        });
        message = "Email ordine cancellato inviata";
        break;

      default:
        res.status(400).json({
          message:
            "Tipo email non valido. Usa: welcome, password-reset, newsletter, order-confirmation, order-admin, order-shipped, order-cancelled",
        });
        return;
    }

    if (result) {
      res.json({
        success: true,
        message,
        note: "Controlla la tua email (e spam) per vedere il risultato",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Errore durante l'invio dell'email",
        error: "Controlla i log del server per dettagli",
      });
    }
  } catch (error) {
    console.error("Errore nel test email:", error);
    res.status(500).json({
      message: "Errore nel test email service",
      error: (error as Error).message,
    });
  }
};
