import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface UserData {
  name: string;
  email: string;
}

export interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  orderDate: string;
  shippingAddress?: any;
}

export interface NewsletterData {
  email: string;
  unsubscribeToken?: string;
}

export interface PasswordResetData {
  name: string;
  email: string;
  resetToken: string;
  resetUrl: string;
}

class EmailService {
  private fromEmail: string;
  private adminEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || "noreply@bambu-ecomm.com";
    this.adminEmail = process.env.ADMIN_EMAIL || "cartoleriabambu@icloud.com";
  }

  /**
   * Metodo base per inviare email
   */
  private async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    try {
      const result = await resend.emails.send({
        from: this.fromEmail,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      });

      console.log("✅ Email inviata con successo:", result);
      return true;
    } catch (error) {
      console.error("❌ Errore invio email:", error);
      return false;
    }
  }

  /**
   * Email di benvenuto per nuovo utente
   */
  async sendWelcomeEmail(userData: UserData): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: userData.email,
      subject: "🌿 Benvenuto in Bambu Ecomm!",
      html: this.generateWelcomeTemplate(userData),
      text: `Ciao ${userData.name}! Benvenuto in Bambu Ecomm. Grazie per esserti registrato!`,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Email di reset password
   */
  async sendPasswordResetEmail(resetData: PasswordResetData): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: resetData.email,
      subject: "🔐 Reset Password - Bambu Ecomm",
      html: this.generatePasswordResetTemplate(resetData),
      text: `Ciao ${resetData.name}! Clicca su questo link per resettare la password: ${resetData.resetUrl}`,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Email conferma iscrizione newsletter
   */
  async sendNewsletterConfirmationEmail(
    newsletterData: NewsletterData
  ): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: newsletterData.email,
      subject: "📧 Iscrizione Newsletter Confermata - Bambu Ecomm",
      html: this.generateNewsletterConfirmationTemplate(newsletterData),
      text: "Grazie per esserti iscritto alla nostra newsletter!",
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Email ordine effettuato (al cliente)
   */
  async sendOrderConfirmationEmail(orderData: OrderData): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: orderData.customerEmail,
      subject: `🛍️ Ordine Confermato #${orderData.orderId} - Bambu Ecomm`,
      html: this.generateOrderConfirmationTemplate(orderData),
      text: `Grazie ${orderData.customerName}! Il tuo ordine #${orderData.orderId} è stato confermato.`,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Email ordine effettuato (al master admin)
   */
  async sendOrderNotificationToAdmin(orderData: OrderData): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: this.adminEmail,
      subject: `🔔 Nuovo Ordine #${orderData.orderId} - Bambu Ecomm`,
      html: this.generateOrderAdminTemplate(orderData),
      text: `Nuovo ordine ricevuto da ${orderData.customerName} - Ordine #${orderData.orderId}`,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Email ordine spedito (al cliente)
   */
  async sendOrderShippedEmail(
    orderData: OrderData & { trackingNumber?: string }
  ): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: orderData.customerEmail,
      subject: `📦 Ordine Spedito #${orderData.orderId} - Bambu Ecomm`,
      html: this.generateOrderShippedTemplate(orderData),
      text: `Ciao ${orderData.customerName}! Il tuo ordine #${orderData.orderId} è stato spedito.`,
    };

    return await this.sendEmail(emailData);
  }

  /**
   * Email ordine cancellato (al cliente)
   */
  async sendOrderCancelledEmail(
    orderData: OrderData & { cancelReason?: string }
  ): Promise<boolean> {
    const emailData: EmailTemplate = {
      to: orderData.customerEmail,
      subject: `❌ Ordine Cancellato #${orderData.orderId} - Bambu Ecomm`,
      html: this.generateOrderCancelledTemplate(orderData),
      text: `Ciao ${orderData.customerName}! Il tuo ordine #${orderData.orderId} è stato cancellato.`,
    };

    return await this.sendEmail(emailData);
  }

  // ==========================================
  // TEMPLATE GENERATORS (HTML)
  // ==========================================

  private generateWelcomeTemplate(userData: UserData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Benvenuto in Bambu Ecomm</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🌿 Benvenuto in Bambu Ecomm!</h1>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #51946b; margin-top: 0;">Ciao ${userData.name}! 👋</h2>
            <p>Grazie per esserti registrato in <strong>Bambu Ecomm</strong>!</p>
            <p>Ora puoi accedere a tutti i nostri prodotti per l'ufficio, la scuola e la creatività.</p>
            
            <div style="margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}" style="background: #51946b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🛍️ Inizia a Shopping
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Ti ringraziamo per aver scelto Bambu Ecomm!</p>
            <p style="margin: 5px 0;">📧 ${this.fromEmail}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generatePasswordResetTemplate(resetData: PasswordResetData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Password - Bambu Ecomm</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Reset Password</h1>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #51946b; margin-top: 0;">Ciao ${resetData.name}!</h2>
            <p>Hai richiesto di resettare la password per il tuo account Bambu Ecomm.</p>
            <p>Clicca sul pulsante qui sotto per creare una nuova password:</p>
            
            <div style="margin: 25px 0; text-align: center;">
              <a href="${resetData.resetUrl}" style="background: #51946b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🔓 Reset Password
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong></p>
              <p style="margin: 5px 0 0 0; color: #856404;">Questo link scadrà tra 1 ora. Se non hai richiesto questo reset, ignora questa email.</p>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Se hai problemi, contattaci a ${this.adminEmail}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateNewsletterConfirmationTemplate(
    newsletterData: NewsletterData
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Newsletter Confermata - Bambu Ecomm</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📧 Newsletter Confermata!</h1>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #51946b; margin-top: 0;">Grazie! 🎉</h2>
            <p>La tua iscrizione alla newsletter di <strong>Bambu Ecomm</strong> è stata confermata.</p>
            <p>Riceverai aggiornamenti su:</p>
            <ul style="color: #51946b;">
              <li>✨ Nuovi prodotti e novità</li>
              <li>🏷️ Offerte esclusive e sconti</li>
              <li>📚 Consigli per l'ufficio e la scuola</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Puoi disiscriverti in qualsiasi momento dalle nostre email.</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateOrderConfirmationTemplate(orderData: OrderData): string {
    const itemsHtml = orderData.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">€${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">€${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Ordine Confermato - Bambu Ecomm</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🛍️ Ordine Confermato!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Ordine #${orderData.orderId}</p>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #51946b; margin-top: 0;">Ciao ${orderData.customerName}! 👋</h2>
            <p>Grazie per il tuo ordine! Abbiamo ricevuto il tuo acquisto e lo stiamo preparando.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #51946b; margin-top: 0;">📦 Dettagli Ordine</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fbfa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #51946b;">Prodotto</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #51946b;">Qta</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #51946b;">Prezzo</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #51946b;">Totale</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fbfa;">
                    <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px;">TOTALE:</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #51946b;">€${orderData.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <p><strong>📅 Data Ordine:</strong> ${orderData.orderDate}</p>
            <p>Ti aggiorneremo via email quando il tuo ordine sarà spedito.</p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Per qualsiasi domanda, contattaci a ${this.adminEmail}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateOrderAdminTemplate(orderData: OrderData): string {
    const itemsHtml = orderData.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Nuovo Ordine - Bambu Ecomm Admin</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc3545; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔔 NUOVO ORDINE RICEVUTO</h1>
            <p style="color: white; margin: 10px 0 0 0;">Ordine #${orderData.orderId}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin-top: 0;">👤 Cliente</h2>
            <p><strong>Nome:</strong> ${orderData.customerName}</p>
            <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            <p><strong>Data:</strong> ${orderData.orderDate}</p>
            
            <h3 style="color: #dc3545;">📦 Prodotti Ordinati</h3>
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dc3545;">Prodotto</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dc3545;">Qta</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dc3545;">Subtotale</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #f8f9fa;">
                  <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">TOTALE ORDINE:</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; color: #dc3545; font-size: 18px;">€${orderData.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; color: #856404;"><strong>⚡ Azione Richiesta:</strong> Prepara l'ordine per la spedizione</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateOrderShippedTemplate(
    orderData: OrderData & { trackingNumber?: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Ordine Spedito - Bambu Ecomm</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📦 Ordine Spedito!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Ordine #${orderData.orderId}</p>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #28a745; margin-top: 0;">Ciao ${orderData.customerName}! 🚀</h2>
            <p>Ottime notizie! Il tuo ordine è stato spedito e sta arrivando da te.</p>
            
            ${
              orderData.trackingNumber
                ? `
              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #28a745; margin-top: 0;">📱 Tracking</h3>
                <p><strong>Numero di Tracking:</strong> <code style="background: #f8f9fa; padding: 5px 10px; border-radius: 3px;">${orderData.trackingNumber}</code></p>
                <p>Puoi tracciare il tuo pacco usando questo numero sul sito del corriere.</p>
              </div>
            `
                : ""
            }
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>📅 Consegna Stimata:</strong> 2-3 giorni lavorativi</p>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Per qualsiasi domanda sulla spedizione, contattaci a ${this.adminEmail}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateOrderCancelledTemplate(
    orderData: OrderData & { cancelReason?: string }
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Ordine Cancellato - Bambu Ecomm</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc3545; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">❌ Ordine Cancellato</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Ordine #${orderData.orderId}</p>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc3545; margin-top: 0;">Ciao ${orderData.customerName},</h2>
            <p>Il tuo ordine #${orderData.orderId} è stato cancellato.</p>
            
            ${
              orderData.cancelReason
                ? `
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24;"><strong>Motivo:</strong> ${orderData.cancelReason}</p>
              </div>
            `
                : ""
            }
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #0c5460;"><strong>💰 Rimborso:</strong> Se hai già pagato, il rimborso sarà processato entro 3-5 giorni lavorativi.</p>
            </div>
            
            <div style="margin: 25px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL}" style="background: #51946b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🛍️ Continua Shopping
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Per qualsiasi domanda, contattaci a ${this.adminEmail}</p>
          </div>
        </body>
      </html>
    `;
  }
}

export default new EmailService();
