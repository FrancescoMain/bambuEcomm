import { Resend } from "resend";
import { escapeHtml as e } from "../lib/http";
import { frontendUrl } from "../lib/urls";

// Creato solo quando serve: senza chiave il costruttore lancia un errore e
// bloccherebbe l'avvio dell'intera API.
let resendClient: Resend | null = null;
const getResend = () => (resendClient ??= new Resend(process.env.RESEND_API_KEY));

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
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
    originalPrice?: number;
    details?: string;
  }>;
  total: number;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  couponCode?: string;
  paymentFee?: number;
  paymentMethod?: string;
  deliveryMethod?: string;
  orderDate: string;
  phone?: string;
  notes?: string;
  invoice?: Record<string, string | null>;
  shippingAddress?: any;
  trackingNumber?: string;
  cancelReason?: string;
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

export interface WithdrawalData {
  email: string;
  nome: string;
  orderId: number;
  requestId: number;
  articoli: { titolo: string; quantity: number }[];
  motivo?: string | null;
  note?: string | null;
  data?: Date;
  indirizzoReso?: string;
}

// Palette del marchio (dal logo)
const C = {
  ink: "#1d1d1f",
  green: "#3f9142",
  greenSoft: "#eef7ee",
  orange: "#f08a24",
  magenta: "#d6197c",
  muted: "#6b6b70",
  border: "#e9e7e2",
  bg: "#f6f5f1",
};

const euro = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

const button = (href: string, label: string, color = C.green) =>
  `<a href="${e(href)}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:15px">${label}</a>`;

const box = (inner: string, bg = "#fff") =>
  `<div style="background:${bg};border:1px solid ${C.border};border-radius:14px;padding:18px 20px;margin:16px 0">${inner}</div>`;

class EmailService {
  private fromEmail: string;
  private fromName: string;
  private adminEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || "noreply@bambu-ecomm.com";
    this.fromName = "Cartoleria Bambù";
    this.adminEmail = process.env.ADMIN_EMAIL || "cartoleriabambu@icloud.com";
  }

  /** true se Resend è configurato (in sviluppo spesso non lo è) */
  isConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
  }

  /** In sviluppo, se TEST_EMAIL è impostata, tutte le email vanno lì. */
  private getRecipient(originalTo: string): string {
    const testEmail = process.env.TEST_EMAIL;
    if ((process.env.NODE_ENV || "development") !== "production" && testEmail) return testEmail;
    return originalTo;
  }

  private async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
      console.warn(`📧 RESEND_API_KEY mancante: email "${emailData.subject}" non inviata`);
      return false;
    }
    try {
      const { error } = await getResend().emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: this.getRecipient(emailData.to),
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        replyTo: emailData.replyTo,
      });
      if (error) {
        console.error("❌ Errore invio email:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("❌ Errore invio email:", error);
      return false;
    }
  }

  /** Layout comune a tutte le email */
  private layout(opts: { title: string; preheader?: string; accent?: string; body: string }): string {
    const accent = opts.accent || C.green;
    const site = frontendUrl();
    return `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.ink};line-height:1.55">
<span style="display:none;max-height:0;overflow:hidden">${e(opts.preheader || opts.title)}</span>
<div style="max-width:600px;margin:0 auto;padding:24px 14px">
  <div style="text-align:center;padding:8px 0 18px">
    <a href="${site}" style="text-decoration:none;color:${C.ink};font-size:26px;font-weight:800;letter-spacing:-0.5px">Bambù<span style="color:${C.green}">.</span></a>
    <div style="font-size:12px;color:${C.muted};letter-spacing:2px;text-transform:uppercase">Cartoleria · Torre Annunziata</div>
  </div>
  <div style="background:#fff;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">
    <div style="height:6px;background:linear-gradient(90deg,${C.orange},${C.magenta},${C.green},#1a8fd6)"></div>
    <div style="padding:28px 26px">
      <h1 style="margin:0 0 6px;font-size:24px;line-height:1.25;color:${accent}">${opts.title}</h1>
      ${opts.body}
    </div>
  </div>
  <div style="text-align:center;color:${C.muted};font-size:12px;padding:18px 8px">
    Cartoleria Bambù · Corso Umberto I, 367 · 80058 Torre Annunziata (NA)<br>
    Hai bisogno di aiuto? Scrivici a <a href="mailto:${this.adminEmail}" style="color:${C.green}">${this.adminEmail}</a>
  </div>
</div></body></html>`;
  }

  private itemsTable(items: OrderData["items"]): string {
    const rows = items
      .map(
        (i) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${C.border};vertical-align:top">
    <div style="font-weight:600">${e(i.name)}</div>
    ${i.details ? `<div style="font-size:13px;color:${C.muted}">${e(i.details)}</div>` : ""}
    <div style="font-size:13px;color:${C.muted}">Qtà ${i.quantity} × ${euro(i.price)}${
          i.originalPrice && i.originalPrice > i.price
            ? ` <span style="text-decoration:line-through">${euro(i.originalPrice)}</span>`
            : ""
        }</div>
  </td>
  <td style="padding:10px 0;border-bottom:1px solid ${C.border};text-align:right;vertical-align:top;font-weight:700;white-space:nowrap">${
    i.price === 0 ? "Omaggio" : euro(i.price * i.quantity)
  }</td>
</tr>`
      )
      .join("");
    return `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px">${rows}</table>`;
  }

  private totals(o: OrderData): string {
    const subtotal = o.subtotal ?? o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const row = (label: string, value: string, strong = false, color = C.ink) =>
      `<tr><td style="padding:4px 0;color:${strong ? C.ink : C.muted};${strong ? "font-weight:800;font-size:17px" : ""}">${label}</td><td style="padding:4px 0;text-align:right;color:${color};${strong ? "font-weight:800;font-size:17px" : ""}">${value}</td></tr>`;
    const shippingLabel =
      o.deliveryMethod === "ritiro" ? "Ritiro in negozio" : o.deliveryMethod === "giornata" ? "Consegna in giornata" : "Spedizione";
    return `<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:10px;font-size:15px">
${row("Subtotale", euro(subtotal))}
${o.discount ? row(`Sconto${o.couponCode ? ` (${e(o.couponCode)})` : ""}`, `-${euro(o.discount)}`, false, C.magenta) : ""}
${o.shippingCost !== undefined ? row(shippingLabel, o.shippingCost === 0 ? "Gratis" : euro(o.shippingCost)) : ""}
${o.paymentFee ? row("Commissione contrassegno", euro(o.paymentFee)) : ""}
${row("Totale", euro(o.total), true)}
</table>`;
  }

  private addressBlock(o: OrderData): string {
    if (o.deliveryMethod === "ritiro") {
      return box(
        `<strong>🏪 Ritiro in negozio</strong><br><span style="color:${C.muted}">Corso Umberto I, 367 · Torre Annunziata. Ti scriviamo quando l'ordine è pronto.</span>`,
        C.greenSoft
      );
    }
    const a = o.shippingAddress;
    if (!a) return "";
    return box(
      `<strong>🚚 Indirizzo di consegna</strong><br>${e(`${a.nome || ""} ${a.cognome || ""}`.trim())}<br>${e(a.via || "")} ${e(a.numero || "")}<br>${e(a.cap || "")} ${e(a.citta || "")} ${a.stato ? `(${e(a.stato)})` : ""}`
    );
  }

  // ==========================================
  // EMAIL AI CLIENTI
  // ==========================================

  async sendWelcomeEmail(userData: UserData): Promise<boolean> {
    const html = this.layout({
      title: `Benvenuto, ${e(userData.name)}!`,
      body: `<p>Grazie per esserti registrato su Cartoleria Bambù. Con il tuo account puoi seguire i tuoi ordini, salvare i prodotti preferiti e fare acquisti più velocemente.</p>
<p style="margin:22px 0">${button(frontendUrl(), "Inizia lo shopping")}</p>`,
    });
    return this.sendEmail({
      to: userData.email,
      subject: "Benvenuto in Cartoleria Bambù!",
      html,
      text: `Ciao ${userData.name}! Benvenuto in Cartoleria Bambù. Grazie per esserti registrato!`,
    });
  }

  async sendPasswordResetEmail(resetData: PasswordResetData): Promise<boolean> {
    const html = this.layout({
      title: "Reimposta la password",
      body: `<p>Ciao ${e(resetData.name)}, abbiamo ricevuto una richiesta di reimpostazione della password del tuo account.</p>
<p style="margin:22px 0">${button(resetData.resetUrl, "Scegli una nuova password")}</p>
<p style="font-size:13px;color:${C.muted}">Il link scade tra 1 ora. Se non hai richiesto tu il reset, ignora questa email: la password resterà invariata.</p>`,
    });
    return this.sendEmail({
      to: resetData.email,
      subject: "Reimposta la password - Cartoleria Bambù",
      html,
      text: `Ciao ${resetData.name}! Reimposta la password da questo link (valido 1 ora): ${resetData.resetUrl}`,
    });
  }

  async sendNewsletterConfirmationEmail(newsletterData: NewsletterData): Promise<boolean> {
    const html = this.layout({
      title: "Iscrizione confermata!",
      body: `<p>Grazie per esserti iscritto alla newsletter di Cartoleria Bambù. Riceverai novità, offerte e idee per scuola, ufficio e tempo libero.</p>
<p style="margin:22px 0">${button(`${frontendUrl()}/offerte`, "Guarda le offerte di oggi", C.magenta)}</p>
<p style="font-size:12px;color:${C.muted}">Puoi annullare l'iscrizione in qualsiasi momento dalla pagina <a href="${frontendUrl()}/newsletter/disiscrizione" style="color:${C.muted}">disiscrizione</a>.</p>`,
    });
    return this.sendEmail({
      to: newsletterData.email,
      subject: "Iscrizione alla newsletter confermata - Cartoleria Bambù",
      html,
      text: "Grazie per esserti iscritto alla newsletter di Cartoleria Bambù!",
    });
  }

  async sendOrderConfirmationEmail(orderData: OrderData): Promise<boolean> {
    const cod = orderData.paymentMethod === "contrassegno";
    const html = this.layout({
      title: "Grazie per il tuo ordine!",
      preheader: `Ordine #${orderData.orderId} ricevuto`,
      body: `<p>Ciao ${e(orderData.customerName)}, abbiamo ricevuto il tuo ordine <strong>#${e(orderData.orderId)}</strong> del ${e(orderData.orderDate)} e lo stiamo preparando con cura.</p>
${cod ? box(`<strong>💶 Pagamento alla consegna</strong><br><span style="color:${C.muted}">Pagherai ${euro(orderData.total)} al corriere al momento della consegna.</span>`, "#fff7ec") : ""}
${box(this.itemsTable(orderData.items) + this.totals(orderData))}
${this.addressBlock(orderData)}
<p style="font-size:14px;color:${C.muted}">Riceverai un'altra email quando l'ordine sarà spedito${orderData.deliveryMethod === "ritiro" ? " o pronto per il ritiro" : ""}. Puoi seguire i tuoi ordini dalla pagina <a href="${frontendUrl()}/account/ordini" style="color:${C.green}">I miei ordini</a>.</p>`,
    });
    return this.sendEmail({
      to: orderData.customerEmail,
      subject: `Ordine #${orderData.orderId} confermato - Cartoleria Bambù`,
      html,
      text: `Grazie ${orderData.customerName}! Il tuo ordine #${orderData.orderId} è confermato. Totale: ${euro(orderData.total)}.`,
    });
  }

  async sendOrderShippedEmail(orderData: OrderData & { trackingNumber?: string }): Promise<boolean> {
    const pickup = orderData.deliveryMethod === "ritiro";
    const tracking = orderData.trackingNumber
      ? box(
          `<strong>📦 Numero di tracking</strong><div style="font-family:monospace;font-size:17px;margin:6px 0 12px">${e(orderData.trackingNumber)}</div>${button(
            `https://gls-group.eu/IT/it/ricerca-spedizione?match=${encodeURIComponent(orderData.trackingNumber)}`,
            "Traccia la spedizione",
            C.orange
          )}`
        )
      : "";
    const html = this.layout({
      title: pickup ? "Il tuo ordine è pronto per il ritiro!" : "Il tuo ordine è in viaggio!",
      preheader: `Ordine #${orderData.orderId}`,
      body: pickup
        ? `<p>Ciao ${e(orderData.customerName)}, il tuo ordine <strong>#${e(orderData.orderId)}</strong> è pronto. Puoi ritirarlo in negozio in Corso Umberto I, 367 a Torre Annunziata negli orari di apertura.</p>${box(this.itemsTable(orderData.items))}`
        : `<p>Ciao ${e(orderData.customerName)}, il tuo ordine <strong>#${e(orderData.orderId)}</strong> è stato spedito.</p>${tracking}<p style="font-size:14px;color:${C.muted}">Consegna stimata: 1-3 giorni lavorativi.</p>`,
    });
    return this.sendEmail({
      to: orderData.customerEmail,
      subject: pickup
        ? `Ordine #${orderData.orderId} pronto per il ritiro - Cartoleria Bambù`
        : `Ordine #${orderData.orderId} spedito - Cartoleria Bambù`,
      html,
      text: pickup
        ? `Il tuo ordine #${orderData.orderId} è pronto per il ritiro.`
        : `Il tuo ordine #${orderData.orderId} è stato spedito.${orderData.trackingNumber ? ` Tracking: ${orderData.trackingNumber}` : ""}`,
    });
  }

  async sendOrderCancelledEmail(orderData: OrderData & { cancelReason?: string }): Promise<boolean> {
    const html = this.layout({
      title: "Ordine annullato",
      accent: C.magenta,
      body: `<p>Ciao ${e(orderData.customerName)}, il tuo ordine <strong>#${e(orderData.orderId)}</strong> è stato annullato${orderData.cancelReason ? ` (${e(orderData.cancelReason)})` : ""}.</p>
<p>Se avevi già pagato, il rimborso verrà accreditato sul metodo di pagamento originale entro 5-10 giorni lavorativi.</p>
${box(this.itemsTable(orderData.items))}`,
    });
    return this.sendEmail({
      to: orderData.customerEmail,
      subject: `Ordine #${orderData.orderId} annullato - Cartoleria Bambù`,
      html,
      text: `Il tuo ordine #${orderData.orderId} è stato annullato.`,
    });
  }

  async sendBackInStockEmail(data: {
    email: string;
    productName: string;
    productImage?: string;
    productUrl: string;
  }): Promise<boolean> {
    const html = this.layout({
      title: "È tornato disponibile!",
      body: `<p>Il prodotto che ti interessava è di nuovo disponibile:</p>
${box(`${data.productImage ? `<img src="${e(data.productImage)}" alt="" width="120" style="border-radius:10px;display:block;margin-bottom:10px">` : ""}<strong style="font-size:17px">${e(data.productName)}</strong>`)}
<p style="margin:22px 0">${button(data.productUrl, "Acquistalo ora")}</p>
<p style="font-size:12px;color:${C.muted}">Hai ricevuto questa email perché hai chiesto di essere avvisato sulla disponibilità del prodotto.</p>`,
    });
    return this.sendEmail({
      to: data.email,
      subject: `${data.productName} è di nuovo disponibile - Cartoleria Bambù`,
      html,
      text: `${data.productName} è di nuovo disponibile: ${data.productUrl}`,
    });
  }

  async sendClaimOrdersEmail(data: { email: string; name: string; count: number; link: string }): Promise<boolean> {
    const html = this.layout({
      title: "Collega i tuoi ordini all'account",
      body: `<p>Ciao${data.name ? ` ${e(data.name)}` : ""}, abbiamo trovato ${data.count} ${data.count === 1 ? "ordine fatto" : "ordini fatti"} come ospite con questo indirizzo email.</p>
<p>Per vederli nella tua area personale conferma che l'email è tua:</p>
<p style="margin:22px 0">${button(data.link, "Collega gli ordini")}</p>
<p style="font-size:13px;color:${C.muted}">Il link vale 2 ore. Se non hai chiesto tu il collegamento, ignora questa email.</p>`,
    });
    return this.sendEmail({
      to: data.email,
      subject: "Collega i tuoi ordini - Cartoleria Bambù",
      html,
      text: `Conferma il collegamento dei tuoi ordini: ${data.link}`,
    });
  }

  async sendWithdrawalReceipt(data: WithdrawalData): Promise<boolean> {
    const list = data.articoli.map((a) => `<li>${e(a.titolo)} × ${a.quantity}</li>`).join("");
    const html = this.layout({
      title: "Abbiamo ricevuto la tua richiesta di recesso",
      body: `<p>Ciao ${e(data.nome)}, confermiamo di aver ricevuto il ${(data.data || new Date()).toLocaleString("it-IT", { timeZone: "Europe/Rome" })} la tua dichiarazione di recesso (richiesta n. ${data.requestId}) per l'ordine <strong>#${data.orderId}</strong>.</p>
${box(`<strong>Articoli</strong><ul style="margin:8px 0 0;padding-left:18px">${list}</ul>${data.motivo ? `<p style="margin:10px 0 0;color:${C.muted}">Motivo: ${e(data.motivo)}</p>` : ""}`)}
<p><strong>Come restituire i prodotti:</strong> spedisci gli articoli integri, nella confezione originale, entro 14 giorni a:<br>${e(data.indirizzoReso || "Cartoleria Bambù, Corso Umberto I, 367, 80058 Torre Annunziata (NA)")}<br>oppure riconsegnali direttamente in negozio. Le spese di restituzione sono a carico del cliente.</p>
<p>Il rimborso avverrà entro 14 giorni dalla ricezione del recesso, con lo stesso metodo di pagamento utilizzato, e potrà essere sospeso fino al ricevimento dei beni.</p>`,
    });
    return this.sendEmail({
      to: data.email,
      subject: `Conferma ricezione recesso - Ordine #${data.orderId}`,
      html,
      text: `Abbiamo ricevuto la tua richiesta di recesso n. ${data.requestId} per l'ordine #${data.orderId}.`,
    });
  }

  // ==========================================
  // EMAIL AL NEGOZIO
  // ==========================================

  async sendOrderNotificationToAdmin(orderData: OrderData): Promise<boolean> {
    const inv = orderData.invoice;
    const html = this.layout({
      title: `Nuovo ordine #${e(orderData.orderId)}`,
      accent: C.orange,
      body: `<p><strong>${e(orderData.customerName)}</strong> · <a href="mailto:${e(orderData.customerEmail)}">${e(orderData.customerEmail)}</a>${orderData.phone ? ` · ${e(orderData.phone)}` : ""}</p>
<p>Consegna: <strong>${orderData.deliveryMethod === "ritiro" ? "Ritiro in negozio" : orderData.deliveryMethod === "giornata" ? "Consegna in giornata" : "Spedizione"}</strong> · Pagamento: <strong>${orderData.paymentMethod === "contrassegno" ? "Contrassegno (da incassare)" : "Pagato online"}</strong></p>
${box(this.itemsTable(orderData.items) + this.totals(orderData))}
${this.addressBlock(orderData)}
${orderData.notes ? box(`<strong>📝 Note del cliente</strong><br>${e(orderData.notes)}`, "#fff7ec") : ""}
${inv ? box(`<strong>🧾 Richiesta fattura</strong><br>${Object.entries(inv).filter(([, v]) => v).map(([k, v]) => `${e(k)}: ${e(v)}`).join("<br>")}`) : ""}
<p style="margin:22px 0">${button(`${frontendUrl()}/dashboard/ordini?id=${encodeURIComponent(orderData.orderId)}`, "Apri nel pannello", C.orange)}</p>`,
    });
    return this.sendEmail({
      to: this.adminEmail,
      subject: `🛍️ Nuovo ordine #${orderData.orderId} - ${euro(orderData.total)}`,
      html,
      replyTo: orderData.customerEmail || undefined,
      text: `Nuovo ordine #${orderData.orderId} da ${orderData.customerName} (${orderData.customerEmail}) - ${euro(orderData.total)}`,
    });
  }

  /** Avviso al negozio per situazioni da controllare a mano (pagamenti anomali) */
  async sendAdminAlert(subject: string, text: string): Promise<boolean> {
    console.error(`⚠️ ${subject}: ${text}`);
    const html = this.layout({
      title: subject,
      accent: C.magenta,
      body: `<p>${e(text)}</p><p style="margin:22px 0">${button(`${frontendUrl()}/dashboard/ordini`, "Apri gli ordini", C.magenta)}</p>`,
    });
    return this.sendEmail({ to: this.adminEmail, subject: `⚠️ ${subject}`, html, text });
  }

  async sendOrderCancelledNotificationToAdmin(orderData: OrderData & { cancelReason?: string }): Promise<boolean> {
    const html = this.layout({
      title: `Ordine #${e(orderData.orderId)} annullato`,
      accent: C.magenta,
      body: `<p>Cliente: <strong>${e(orderData.customerName)}</strong> (${e(orderData.customerEmail)})</p>
<p>Motivo: ${e(orderData.cancelReason || "non indicato")} · Totale: ${euro(orderData.total)}</p>
${box(this.itemsTable(orderData.items))}`,
    });
    return this.sendEmail({
      to: this.adminEmail,
      subject: `Ordine #${orderData.orderId} annullato`,
      html,
      text: `Ordine #${orderData.orderId} annullato - Cliente: ${orderData.customerName}`,
    });
  }

  async sendContactMessageToAdmin(msg: {
    tipo?: string;
    nome: string;
    email: string;
    telefono?: string | null;
    oggetto?: string | null;
    messaggio: string;
    dati?: unknown;
  }): Promise<boolean> {
    const label =
      msg.tipo === "b2b" ? "Richiesta rivenditore (B2B)" : msg.tipo === "preventivo" ? "Richiesta di preventivo" : "Nuovo messaggio dal sito";
    const extra =
      msg.dati && typeof msg.dati === "object"
        ? Object.entries(msg.dati as Record<string, unknown>)
            .filter(([, v]) => v)
            .map(([k, v]) => `<strong>${e(k)}:</strong> ${e(v)}`)
            .join("<br>")
        : "";
    const html = this.layout({
      title: label,
      accent: C.orange,
      body: `<p><strong>${e(msg.nome)}</strong> · <a href="mailto:${e(msg.email)}">${e(msg.email)}</a>${msg.telefono ? ` · ${e(msg.telefono)}` : ""}</p>
${msg.oggetto ? `<p><strong>Oggetto:</strong> ${e(msg.oggetto)}</p>` : ""}
${extra ? box(extra) : ""}
${box(`<div style="white-space:pre-wrap">${e(msg.messaggio)}</div>`)}
<p style="font-size:13px;color:${C.muted}">Rispondi direttamente a questa email per scrivere al cliente.</p>`,
    });
    return this.sendEmail({
      to: this.adminEmail,
      subject: `${label}: ${msg.oggetto || msg.nome}`,
      html,
      replyTo: msg.email,
      text: `${label} da ${msg.nome} (${msg.email}): ${msg.messaggio}`,
    });
  }

  async sendWithdrawalToAdmin(data: WithdrawalData): Promise<boolean> {
    const list = data.articoli.map((a) => `<li>${e(a.titolo)} × ${a.quantity}</li>`).join("");
    const html = this.layout({
      title: `Richiesta di recesso - Ordine #${data.orderId}`,
      accent: C.magenta,
      body: `<p><strong>${e(data.nome)}</strong> · <a href="mailto:${e(data.email)}">${e(data.email)}</a></p>
${box(`<ul style="margin:0;padding-left:18px">${list}</ul>${data.motivo ? `<p style="margin:10px 0 0">Motivo: ${e(data.motivo)}</p>` : ""}${data.note ? `<p style="margin:6px 0 0">Note: ${e(data.note)}</p>` : ""}`)}
<p style="margin:22px 0">${button(`${frontendUrl()}/dashboard/recessi`, "Gestisci nel pannello", C.magenta)}</p>`,
    });
    return this.sendEmail({
      to: this.adminEmail,
      subject: `↩️ Recesso richiesto - Ordine #${data.orderId}`,
      html,
      replyTo: data.email,
      text: `Richiesta di recesso per l'ordine #${data.orderId} da ${data.nome} (${data.email}).`,
    });
  }
}

const emailService = new EmailService();
export default emailService;
