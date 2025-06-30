"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
class EmailService {
    constructor() {
        this.fromEmail = process.env.FROM_EMAIL || "noreply@bambu-ecomm.com";
        this.fromName = "Cartoleria Bambu";
        this.adminEmail = process.env.ADMIN_EMAIL || "cartoleriabambu@icloud.com";
        // Debug configurazione
        console.log("📧 EmailService inizializzato con:", {
            fromEmail: this.fromEmail,
            adminEmail: this.adminEmail,
            nodeEnv: process.env.NODE_ENV,
            testEmail: process.env.TEST_EMAIL,
            hasResendKey: !!process.env.RESEND_API_KEY &&
                process.env.RESEND_API_KEY !== "your_resend_api_key_here",
        });
    }
    /**
     * Determina il destinatario finale dell'email
     * In development/testing, reindirizziamo tutto all'admin
     */
    getRecipient(originalTo) {
        const nodeEnv = process.env.NODE_ENV || "development";
        const testEmail = process.env.TEST_EMAIL;
        if (nodeEnv !== "production" && testEmail) {
            console.log(`📧 [DEV MODE] Reindirizzando email da ${originalTo} a ${testEmail}`);
            return testEmail;
        }
        return originalTo;
    }
    /**
     * Metodo base per inviare email
     */
    async sendEmail(emailData) {
        try {
            const finalRecipient = this.getRecipient(emailData.to);
            const result = await resend.emails.send({
                from: `${this.fromName} <${this.fromEmail}>`,
                to: finalRecipient,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
            });
            console.log("✅ Email inviata con successo:", result);
            return true;
        }
        catch (error) {
            console.error("❌ Errore invio email:", error);
            return false;
        }
    }
    /**
     * Email di benvenuto per nuovo utente
     */
    async sendWelcomeEmail(userData) {
        const emailData = {
            to: userData.email,
            subject: "🌿 Benvenuto in Cartoleria Bambù!",
            html: this.generateWelcomeTemplate(userData),
            text: `Ciao ${userData.name}! Benvenuto in Cartoleria Bambù. Grazie per esserti registrato!`,
        };
        return await this.sendEmail(emailData);
    }
    /**
     * Email di reset password
     */ async sendPasswordResetEmail(resetData) {
        const emailData = {
            to: resetData.email,
            subject: "🔐 Reset Password - Cartoleria Bambù",
            html: this.generatePasswordResetTemplate(resetData),
            text: `Ciao ${resetData.name}! Clicca su questo link per resettare la password: ${resetData.resetUrl}`,
        };
        return await this.sendEmail(emailData);
    }
    /**
     * Email conferma iscrizione newsletter
     */ async sendNewsletterConfirmationEmail(newsletterData) {
        const emailData = {
            to: newsletterData.email,
            subject: "📧 Iscrizione Newsletter Confermata - Cartoleria Bambù",
            html: this.generateNewsletterConfirmationTemplate(newsletterData),
            text: "Grazie per esserti iscritto alla nostra newsletter!",
        };
        return await this.sendEmail(emailData);
    }
    /**
     * Email ordine effettuato (al cliente)
     */ async sendOrderConfirmationEmail(orderData) {
        const emailData = {
            to: orderData.customerEmail,
            subject: `🛍️ Ordine Confermato #${orderData.orderId} - Cartoleria Bambù`,
            html: this.generateOrderConfirmationTemplate(orderData),
            text: `Grazie ${orderData.customerName}! Il tuo ordine #${orderData.orderId} è stato confermato.`,
        };
        return await this.sendEmail(emailData);
    }
    /**
     * Email ordine effettuato (al master admin)
     */ async sendOrderNotificationToAdmin(orderData) {
        const emailData = {
            to: this.adminEmail,
            subject: `🔔 Nuovo Ordine #${orderData.orderId} - Cartoleria Bambù`,
            html: this.generateOrderAdminTemplate(orderData),
            text: `Nuovo ordine ricevuto da ${orderData.customerName} - Ordine #${orderData.orderId}`,
        };
        return await this.sendEmail(emailData);
    }
    /**
     * Email ordine spedito (al cliente)
     */ async sendOrderShippedEmail(orderData) {
        const emailData = {
            to: orderData.customerEmail,
            subject: `📦 Ordine Spedito #${orderData.orderId} - Cartoleria Bambù`,
            html: this.generateOrderShippedTemplate(orderData),
            text: `Ciao ${orderData.customerName}! Il tuo ordine #${orderData.orderId} è stato spedito.`,
        };
        return await this.sendEmail(emailData);
    }
    /**
     * Email ordine cancellato (al cliente)
     */ async sendOrderCancelledEmail(orderData) {
        const emailData = {
            to: orderData.customerEmail,
            subject: `❌ Ordine Cancellato #${orderData.orderId} - Cartoleria Bambù`,
            html: this.generateOrderCancelledTemplate(orderData),
            text: `Ciao ${orderData.customerName}! Il tuo ordine #${orderData.orderId} è stato cancellato.`,
        };
        return await this.sendEmail(emailData);
    }
    /**
     * Email ordine cancellato (all'admin)
     */
    async sendOrderCancelledNotificationToAdmin(orderData) {
        const emailData = {
            to: this.adminEmail,
            subject: `🚫 Ordine Cancellato #${orderData.orderId} - Cartoleria Bambù`,
            html: this.generateOrderCancelledAdminTemplate(orderData),
            text: `Ordine cancellato: #${orderData.orderId} - Cliente: ${orderData.customerName}`,
        };
        return await this.sendEmail(emailData);
    }
    // ==========================================
    // TEMPLATE GENERATORS (HTML)
    // ==========================================
    generateWelcomeTemplate(userData) {
        return `
      <!DOCTYPE html>
      <html>        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Benvenuto in Cartoleria Bambù</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🌿 Benvenuto in Cartoleria Bambù!</h1>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #51946b; margin-top: 0;">Ciao ${userData.name}! 👋</h2>
            <p>Grazie per esserti registrato in <strong>Cartoleria Bambù</strong>!</p>
            <p>Ora puoi accedere a tutti i nostri prodotti per l'ufficio, la scuola e la creatività.</p>
            
            <div style="margin: 25px 0;">
              <a href="${process.env.FRONTEND_URL}" style="background: #51946b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🛍️ Inizia a Shopping
              </a>
            </div>
          </div>
            <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Ti ringraziamo per aver scelto Cartoleria Bambù!</p>
            <p style="margin: 5px 0;">📧 ${this.fromEmail}</p>
          </div>
        </body>
      </html>
    `;
    }
    generatePasswordResetTemplate(resetData) {
        return `
      <!DOCTYPE html>
      <html>        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Password - Cartoleria Bambù</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Reset Password</h1>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #51946b; margin-top: 0;">Ciao ${resetData.name}!</h2>
            <p>Hai richiesto di resettare la password per il tuo account Cartoleria Bambù.</p>
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
    generateNewsletterConfirmationTemplate(newsletterData) {
        return `
      <!DOCTYPE html>
      <html>        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Newsletter Confermata - Cartoleria Bambù</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📧 Newsletter Confermata!</h1>
          </div>
          
          <div style="background: #f8fbfa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #51946b; margin-top: 0; font-size: 24px;">Grazie! 🎉</h2>
            <p>La tua iscrizione alla newsletter di <strong>Cartoleria Bambù</strong> è stata confermata.</p>
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
    generateOrderConfirmationTemplate(orderData) {
        const itemsHtml = orderData.items
            .map((item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; word-wrap: break-word;">${item.name}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right;">€${item.price.toFixed(2)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">€${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `)
            .join("");
        // Calcola subtotale e spedizione dai dati forniti o calcola da zero
        const subtotal = orderData.subtotal ??
            orderData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const shippingCost = orderData.shippingCost ?? (subtotal >= 50 ? 0 : 4.99);
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ordine Confermato - Cartoleria Bambù</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 10px !important; }
              .header { padding: 20px 15px !important; }
              .content { padding: 15px !important; }
              table { font-size: 14px !important; }
              .responsive-table td { padding: 8px 4px !important; }
              .mobile-hide { display: none !important; }
              .mobile-center { text-align: center !important; }
              .summary-row { display: block !important; margin-bottom: 8px !important; }
              .summary-label { display: inline-block !important; width: 50% !important; }
              .summary-value { display: inline-block !important; width: 50% !important; text-align: right !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(135deg, #51946b, #6db587); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🛍️ Ordine Confermato!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Ordine #${orderData.orderId}</p>
            </div>
            
            <!-- Main Content -->
            <div class="content" style="background: #f8fbfa; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #51946b; margin-top: 0; font-size: 24px;">Ciao ${orderData.customerName}! 👋</h2>
              <p style="margin-bottom: 20px; font-size: 16px;">Grazie per il tuo ordine! Abbiamo ricevuto il tuo acquisto e lo stiamo preparando con cura.</p>
              
              <!-- Order Details -->
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #51946b; margin-top: 0; margin-bottom: 20px; font-size: 20px;">📦 Dettagli Ordine</h3>
                
                <div style="overflow-x: auto;">
                  <table class="responsive-table" style="width: 100%; border-collapse: collapse; min-width: 300px;">
                    <thead>
                      <tr style="background: #f8fbfa;">
                        <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #51946b; font-weight: bold;">Prodotto</th>
                        <th style="padding: 12px 8px; text-align: center; border-bottom: 2px solid #51946b; font-weight: bold;">Qta</th>
                        <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #51946b; font-weight: bold;">Prezzo</th>
                        <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #51946b; font-weight: bold;">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </div>

                <!-- Order Summary -->
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                  <div class="summary-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="summary-label" style="font-size: 16px;">Subtotale:</span>
                    <span class="summary-value" style="font-size: 16px;">€${subtotal.toFixed(2)}</span>
                  </div>
                  <div class="summary-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span class="summary-label" style="font-size: 16px;">Spedizione:</span>
                    <span class="summary-value" style="font-size: 16px; ${shippingCost === 0 ? "color: #51946b; font-weight: bold;" : ""}">${shippingCost === 0 ? "GRATUITA 🎉" : "€" + shippingCost.toFixed(2)}</span>
                  </div>
                  <div class="summary-row" style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 2px solid #51946b;">
                    <span class="summary-label" style="font-size: 18px; font-weight: bold;">TOTALE:</span>
                    <span class="summary-value" style="font-size: 20px; font-weight: bold; color: #51946b;">€${orderData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <!-- Order Info -->
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>📅 Data Ordine:</strong> ${orderData.orderDate}</p>
                <p style="margin: 0 0 10px 0;"><strong>📧 Email:</strong> ${orderData.customerEmail}</p>
                ${orderData.shippingAddress
            ? `
                <p style="margin: 0 0 10px 0;"><strong>🚚 Indirizzo di spedizione:</strong></p>
                <div style="margin-left: 20px; color: #666;">
                  ${orderData.shippingAddress.via || ""} ${orderData.shippingAddress.numero || ""}<br>
                  ${orderData.shippingAddress.cap || ""} ${orderData.shippingAddress.citta || ""}<br>
                  ${orderData.shippingAddress.stato || ""}
                </div>
                `
            : ""}
              </div>
              
              <!-- Shipping Info -->
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #51946b; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #51946b;">🚚 Spedizione e Tempi di Consegna</p>
                <p style="margin: 8px 0 0 0; font-size: 14px;">Ti aggiorneremo via email quando il tuo ordine sarà spedito con il numero di tracking per seguire la spedizione. Tempi di consegna stimati: 3-5 giorni lavorativi.</p>
                ${shippingCost === 0 ? '<p style="margin: 8px 0 0 0; font-size: 14px; color: #51946b; font-weight: bold;">🎉 Spedizione gratuita per ordini superiori a €50!</p>' : ""}
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; color: #666; font-size: 14px; padding: 20px 0;">
              <p style="margin: 0 0 10px 0;">📞 Per qualsiasi domanda, contattaci a <a href="mailto:${this.adminEmail}" style="color: #51946b;">${this.adminEmail}</a></p>
              <p style="margin: 0; font-size: 12px; color: #999;">Cartoleria Bambù - La tua cartoleria di fiducia</p>
            </div>
            
          </div>
        </body>
      </html>
    `;
    }
    generateOrderAdminTemplate(orderData) {
        const itemsHtml = orderData.items
            .map((item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `)
            .join("");
        return `
      <!DOCTYPE html>
      <html>        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Nuovo Ordine - Cartoleria Bambù Admin</title>
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
    generateOrderShippedTemplate(orderData) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ordine Spedito - Cartoleria Bambù</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 10px !important; }
              .header { padding: 20px 15px !important; }
              .content { padding: 15px !important; }
              .tracking-code { font-size: 14px !important; padding: 8px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📦 Ordine Spedito!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Ordine #${orderData.orderId}</p>
            </div>
            
            <!-- Main Content -->
            <div class="content" style="background: #f8fbfa; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #28a745; margin-top: 0; font-size: 24px;">Ciao ${orderData.customerName}! 🚀</h2>
              <p style="margin-bottom: 20px; font-size: 16px;">Ottime notizie! Il tuo ordine è stato spedito e sta arrivando da te.</p>
              
              ${orderData.trackingNumber
            ? `
              <!-- Tracking Info -->
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #28a745; margin-top: 0; margin-bottom: 15px; font-size: 20px;">📱 Informazioni di Tracking</h3>
                <p style="margin-bottom: 15px;"><strong>Numero di Tracking:</strong></p>
                <div class="tracking-code" style="background: #f8f9fa; padding: 12px 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #e9ecef;">
                  <code style="font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #28a745;">${orderData.trackingNumber}</code>
                </div>
                
                <!-- GLS Tracking Button -->
                <div style="text-align: center; margin: 20px 0;">
                  <a href="https://gls-group.eu/IT/it/ricerca-spedizione?match=${orderData.trackingNumber}" 
                     target="_blank" 
                     style="background: #ff6600; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    🚚 Traccia con GLS
                  </a>
                </div>
                
                <p style="margin: 0; font-size: 14px; color: #666;">Clicca sul pulsante sopra per tracciare la tua spedizione direttamente sul sito GLS, oppure usa il numero di tracking su altri siti di tracking spedizioni.</p>
              </div>
            `
            : `
              <!-- No Tracking -->
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px; font-size: 20px;">📦 Informazioni Spedizione</h3>
                <p style="margin: 0; color: #856404;">Il tuo ordine è stato spedito. Le informazioni di tracking saranno disponibili nelle prossime ore.</p>
              </div>
            `}
              
              <!-- Delivery Info -->
              <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c3e6cb;">
                <p style="margin: 0; color: #155724; font-weight: bold;">📅 Consegna Stimata: 2-3 giorni lavorativi</p>
                <p style="margin: 8px 0 0 0; color: #155724; font-size: 14px;">Ti invieremo una notifica quando il pacco sarà consegnato.</p>
              </div>
              
              <!-- Support Info -->
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #28a745; margin-top: 0; margin-bottom: 15px; font-size: 18px;">💬 Hai domande?</h3>
                <p style="margin: 0; font-size: 14px; color: #666;">Se hai bisogno di assistenza riguardo la tua spedizione, non esitare a contattarci. Siamo qui per aiutarti!</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; color: #666; font-size: 14px; padding: 20px 0;">
              <p style="margin: 0 0 10px 0;">📞 Per qualsiasi domanda sulla spedizione, contattaci a <a href="mailto:${this.adminEmail}" style="color: #28a745;">${this.adminEmail}</a></p>
              <p style="margin: 0; font-size: 12px; color: #999;">Cartoleria Bambù - La tua cartoleria di fiducia</p>
            </div>
            
          </div>
        </body>
      </html>
    `;
    }
    generateOrderCancelledTemplate(orderData) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ordine Cancellato - Cartoleria Bambù</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; padding: 10px !important; }
              .header { padding: 20px 15px !important; }
              .content { padding: 15px !important; }
              .button { padding: 10px 20px !important; font-size: 14px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
          <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(135deg, #dc3545, #c82333); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">❌ Ordine Cancellato</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Ordine #${orderData.orderId}</p>
            </div>
            
            <!-- Main Content -->
            <div class="content" style="background: #f8fbfa; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #dc3545; margin-top: 0; font-size: 24px;">Ciao ${orderData.customerName},</h2>
              <p style="margin-bottom: 20px; font-size: 16px;">Il tuo ordine #${orderData.orderId} è stato cancellato con successo.</p>
              
              ${orderData.cancelReason
            ? `
              <!-- Cancel Reason -->
              <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
                <h3 style="color: #721c24; margin-top: 0; margin-bottom: 10px; font-size: 18px;">📝 Motivo della Cancellazione</h3>
                <p style="margin: 0; color: #721c24; font-size: 14px;">${orderData.cancelReason}</p>
              </div>
            `
            : ""}
              
              <!-- Refund Info -->
              <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bee5eb;">
                <h3 style="color: #0c5460; margin-top: 0; margin-bottom: 15px; font-size: 20px;">💰 Informazioni Rimborso</h3>
                <p style="margin: 0 0 10px 0; color: #0c5460; font-size: 16px;">Se hai già effettuato il pagamento, il rimborso sarà processato automaticamente.</p>
                <ul style="margin: 10px 0; color: #0c5460; font-size: 14px;">
                  <li>⏱️ Tempo di elaborazione: 3-5 giorni lavorativi</li>
                  <li>� Il rimborso apparirà sulla stessa carta utilizzata per l'acquisto</li>
                  <li>📧 Riceverai una conferma via email quando il rimborso sarà completato</li>
                </ul>
              </div>
              
              <!-- Order Summary -->
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #dc3545; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📦 Riepilogo Ordine Cancellato</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">Importo Totale:</span>
                  <span style="font-weight: bold; color: #dc3545;">€${orderData.total.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                  <span style="color: #666;">Data Ordine:</span>
                  <span style="color: #666;">${orderData.orderDate}</span>
                </div>
              </div>
              
              <!-- Continue Shopping -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}" class="button" style="background: #51946b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  🛍️ Continua lo Shopping
                </a>
              </div>
              
              <!-- Support -->
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #51946b; margin-top: 0; margin-bottom: 15px; font-size: 18px;">💬 Hai bisogno di aiuto?</h3>
                <p style="margin: 0; font-size: 14px; color: #666;">Se hai domande sulla cancellazione o sul rimborso, il nostro team di supporto è qui per aiutarti.</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; color: #666; font-size: 14px; padding: 20px 0;">
              <p style="margin: 0 0 10px 0;">📞 Per qualsiasi domanda, contattaci a <a href="mailto:${this.adminEmail}" style="color: #51946b;">${this.adminEmail}</a></p>
              <p style="margin: 0; font-size: 12px; color: #999;">Cartoleria Bambù - La tua cartoleria di fiducia</p>
            </div>
            
          </div>
        </body>
      </html>
    `;
    }
    generateOrderCancelledAdminTemplate(orderData) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ordine Cancellato - Admin - Cartoleria Bambù</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            
            <!-- Header -->
            <div style="background: #dc3545; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚫 ORDINE CANCELLATO</h1>
              <p style="color: white; margin: 10px 0 0 0;">Ordine #${orderData.orderId}</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #dc3545; margin-top: 0;">👤 Dettagli Cancellazione</h2>
              <p><strong>Cliente:</strong> ${orderData.customerName}</p>
              <p><strong>Email:</strong> ${orderData.customerEmail}</p>
              <p><strong>Data Ordine:</strong> ${orderData.orderDate}</p>
              <p><strong>Importo:</strong> €${orderData.total.toFixed(2)}</p>
              
              ${orderData.cancelReason
            ? `
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #721c24;"><strong>Motivo Cancellazione:</strong> ${orderData.cancelReason}</p>
              </div>
              `
            : ""}
              
              <h3 style="color: #dc3545;">📦 Prodotti nell'Ordine</h3>
              <table style="width: 100%; border-collapse: collapse; background: white; margin: 10px 0;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dc3545;">Prodotto</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dc3545;">Qta</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dc3545;">Prezzo</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.items
            .map((item) => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">€${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  `)
            .join("")}
                </tbody>
              </table>
            </div>
            
            <!-- Alert -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Azione Richiesta:</strong> Verificare se è necessario elaborare un rimborso e aggiornare l'inventario.</p>
            </div>
            
          </div>
        </body>
      </html>
    `;
    }
}
exports.default = new EmailService();
