# 🥗 SmartMeal — Personal Food & Grocery Optimizer

Dashboard intelligente per la gestione dell’alimentazione quotidiana, delle ricette, del frigorifero e della spesa.

> **Principio fondamentale:** *Prima utilizza ciò che possiedi, poi suggerisci cosa comprare.*

---

## 🚀 Guida al Deploy su Vercel

Puoi caricare l'applicazione su Vercel in due modi semplicissimi:

### Metodo 1: Tramite GitHub (Consigliato per condividere il link)

1. **Crea un nuovo repository su GitHub**:
   - Vai su [github.com/new](https://github.com/new) e crea un repository (es. `smartmeal`).
2. **Collega e carica il codice**:
   Nel terminale all'interno della cartella del progetto:
   ```bash
   git remote add origin https://github.com/TUO-USERNAME/smartmeal.git
   git push -u origin main
   ```
3. **Importa su Vercel**:
   - Accedi a [vercel.com](https://vercel.com) (puoi fare login con GitHub).
   - Clicca su **"Add New..."** → **"Project"**.
   - Seleziona il repository `smartmeal`.
   - Vercel riconoscerà in automatico **Vite**:
     - *Build Command:* `npm run build`
     - *Output Directory:* `dist`
     - *Install Command:* `npm install`
   - Clicca su **"Deploy"**.
4. In meno di un minuto riceverai il link pubblico (es. `https://smartmeal-tuo-nome.vercel.app`) pronto da inviare al tuo amico!

---

### Metodo 2: Tramite Vercel CLI (Istantaneo da terminale)

Se vuoi pubblicare direttamente dalla riga di comando senza passare da GitHub:

```bash
# 1. Spostati nella cartella
cd /Users/federicobellotti/.gemini/antigravity/scratch/smartmeal

# 2. Esegui il deploy
npx vercel
```

- Segui le istruzioni a schermo (ti chiederà di autenticarti nel browser se non l'hai già fatto).
- Seleziona le opzioni predefinite premendo Invio.
- Per il deploy in produzione:
  ```bash
  npx vercel --prod
  ```
- Al termine avrai il link live immediato.

---

## 🛠️ Stack Tecnologico

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React
- **Grafici:** Recharts
- **Animazioni:** Canvas Confetti
- **Persistenza:** LocalStorage reattivo sincronizzato
- **AI Integrata:** Motore euristico locale + opzionale Google Gemini API

---

## 🧪 Esecuzione in Locale

```bash
npm install
npm run dev
```

L'applicazione sarà accessibile su `http://localhost:5173`.
