# 🔧 BACKUP E ROLLBACK PLAN - Implementazione Varianti negli Ordini

**Data**: 2025-07-14  
**Autore**: GitHub Copilot  
**Obiettivo**: Aggiungere supporto per varianti selezionate negli ordini senza perdere dati

## 📊 Stato Pre-Implementazione

### Database Schema Attuale

- **OrderItem**: Contiene solo `id`, `orderId`, `productId`, `quantity`, `priceAtPurchase`
- **CartItem**: Contiene solo `id`, `cartId`, `productId`, `quantity`
- **Nessun campo** per salvare le varianti selezionate

### Problemi Identificati

1. ❌ Le varianti selezionate durante l'acquisto non vengono salvate
2. ❌ La dashboard non mostra che variante ha scelto il cliente
3. ❌ Impossibile ricostruire l'ordine esatto del cliente

## 🔄 Piano di Implementazione

### 1. Modifiche Database (SAFE - Solo Aggiunte)

```sql
-- Aggiunta campo opzionale a OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "selectedVariants" JSONB;

-- Aggiunta campo opzionale a CartItem
ALTER TABLE "CartItem" ADD COLUMN "selectedVariants" JSONB;
```

### 2. Struttura selectedVariants

```json
{
  "1": { "id": 5, "nome": "Rosso", "immagine": "red.jpg" },
  "2": { "id": 12, "nome": "Large", "immagine": null }
}
```

Dove la chiave è l'ID del ProductVariantType e il valore contiene i dettagli della variante selezionata.

### 3. Backward Compatibility

- ✅ Ordini esistenti: `selectedVariants` sarà `null`
- ✅ API: Gestisce sia richieste con che senza varianti
- ✅ UI: Mostra varianti quando disponibili, altrimenti solo prodotto

## 🚨 Piano di Rollback

### Se qualcosa va storto:

1. **Rollback Database**:

   ```sql
   ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "selectedVariants";
   ALTER TABLE "CartItem" DROP COLUMN IF EXISTS "selectedVariants";
   ```

2. **Ripristino Schema**:

   ```bash
   cp backup_schema_pre_variants.prisma schema.prisma
   npx prisma db push --force-reset
   ```

3. **Ripristino Codice**:
   - Revert dei commit con `git revert`
   - Backup del codice pre-modifiche disponibile

## 📁 Files di Backup Creati

- `backup_schema_pre_variants.prisma` - Schema originale completo
- `BACKUP_ROLLBACK_PLAN.md` - Questo documento

## ✅ Checkpoint di Sicurezza

- [x] Backup schema database creato
- [x] Piano di rollback documentato
- [x] Modifiche progettate come additive-only
- [ ] Test su ambiente di staging
- [ ] Migrazione applicata
- [ ] Codice aggiornato
- [ ] Test funzionalità completa

## 🔍 Test di Verifica Post-Implementazione

1. **Ordini Esistenti**: Verificare che continuino a funzionare
2. **Nuovi Ordini con Varianti**: Verificare che le varianti vengano salvate
3. **Dashboard**: Verificare visualizzazione varianti
4. **Carrello**: Verificare gestione varianti nel carrello
5. **API**: Verificare backward compatibility

---

⚠️ **NOTA**: Prima di procedere in produzione, testare sempre su un ambiente di staging!
