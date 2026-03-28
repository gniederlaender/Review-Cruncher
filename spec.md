# Review Cruncher — Technische Spezifikation

## 1. Projektübersicht

Review Cruncher ist eine Web-Applikation, die Nutzern ermöglicht, durch Eingabe eines Produktnamens oder einer Produkt-URL automatisiert eine KI-gestützte Produktrezension zu generieren. Die App extrahiert bei URL-Eingabe den Produktnamen im Hintergrund und startet anschließend denselben Review-Prozess wie bei einer manuellen Texteingabe.

---

## 2. Zielgruppe & User Stories

- Als **Konsument** möchte ich einen Produktnamen eingeben, damit ich schnell eine strukturierte KI-Analyse des Produkts erhalte.
- Als **Konsument** möchte ich eine Amazon- oder Shop-URL einfügen, damit ich ohne manuelle Namenseingabe direkt eine Produktrezension starten kann.
- Als **Konsument** möchte ich, dass die URL-Erkennung im Hintergrund abläuft, damit sich mein gewohnter Workflow nicht verändert.
- Als **Konsument** möchte ich bei fehlgeschlagener URL-Erkennung eine klare Rückmeldung erhalten, damit ich den Produktnamen manuell nachtragen kann.

---

## 3. Features & Screens

> **Grundsatz:** Die Implementierung der URL-Erkennung verändert den bestehenden User-Flow und Screen-Flow nicht. Es wird kein neuer Screen eingeführt. Die URL-Extraktion ist ein transparentes Hintergrund-Feature.

### Screen 1 — Startseite / Produkteingabe
- Einzelnes Eingabefeld, das sowohl **Freitext (Produktname)** als auch **URLs** akzeptiert.
- Keine UI-Unterscheidung zwischen den beiden Eingabemodi — gleiche UI, gleicher Absende-Button.
- Bei Erkennung einer URL: Produktname wird serverseitig extrahiert und der normale Review-Flow wird mit diesem Namen gestartet.
- Bei fehlgeschlagener Extraktion: Inline-Fehlermeldung im selben Screen mit der Aufforderung, den Produktnamen manuell einzugeben. Kein Seitenwechsel.

### Screen 2 — Review-Ergebnis
- Zeigt die generierte KI-Produktrezension an.
- Dieser Screen ist identisch, unabhängig davon ob der Produktname manuell eingegeben oder per URL extrahiert wurde.

---

## 4. Technische Architektur

- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **KI-Integration:** OpenAI API (GPT-4o) zur Review-Generierung
- **URL-Parsing-Bibliothek:** `node-html-parser` oder `cheerio` für serverseitiges HTML-Parsing

### URL-Erkennungs-Logik (Backend)

Der Backend-Endpunkt prüft die Eingabe auf eine gültige URL-Struktur. Bei positiver Erkennung wird folgender Extraktions-Ablauf ausgeführt:

1. **Simpler HTTP-Fetch** der Ziel-URL mit einem generischen `User-Agent`-Header.
2. **Schema.org JSON-LD** im `<script type="application/ld+json">`-Tag parsen — Feld `name` wird als Produktname verwendet. Dies ist die bevorzugte und präziseste Quelle.
3. **OpenGraph `og:title`** als zweite Quelle, falls kein Schema.org-Tag vorhanden ist.
4. **URL-Pfad-Analyse** als letzter Fallback — Slug-Segmente des Pfades werden bereinigt und als Produktname interpretiert (z. B. `/Apple-iPhone-17-Pro/dp/...` → `Apple iPhone 17 Pro`).
5. Bei vollständigem Fehlschlagen aller drei Schritte (z. B. CAPTCHA, leere Antwort, Timeout): Rückgabe eines Fehler-Flags an das Frontend, das den Nutzer zur manuellen Eingabe auffordert.

Der extrahierte Produktname wird anschließend identisch zum manuell eingegebenen Namen behandelt und in den bestehenden Review-Generierungs-Flow übergeben.

### Datenfluss

```
Nutzereingabe (Text oder URL)
        │
        ▼
[Frontend] Eingabe-Validierung: URL erkannt?
        │
   Ja   │   Nein
        │     └──────────────────────────────┐
        ▼                                     │
[API Route] HTTP-Fetch der URL                │
        │                                     │
        ▼                                     │
[API Route] Extraktion: JSON-LD → og:title → URL-Pfad
        │                                     │
  Erfolg│  Fehler                             │
        │    └── Fehler-Flag → Frontend       │
        │        (manuelle Eingabe)           │
        ▼                                     ▼
[API Route] Produktname → OpenAI API → Review-Text
        │
        ▼
[Frontend] Review-Ergebnis-Screen
```

---

## 5. Deployment

- **Plattform:** Vercel (optimiert für Next.js, serverless API Routes ohne zusätzliche Konfiguration)
- **Umgebungsvariablen:** `OPENAI_API_KEY` wird als Vercel Environment Variable hinterlegt und ist ausschließlich serverseitig zugänglich.
- **Build-Prozess:** Automatisches Deployment bei Push auf den `main`-Branch via Vercel Git-Integration.
- **Timeout-Konfiguration:** API Routes für URL-Fetching erhalten ein explizites Timeout von **5 Sekunden**, um hängende Anfragen bei blockierenden Seiten (z. B. Amazon) zu vermeiden und den Fallback-Pfad zuverlässig auszulösen.