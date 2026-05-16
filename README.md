# Beckers Brotsorten — Hofladen PWA

Mobile Web-App fuer den Hofladen von Anna Becker. Kunden sehen taeglich welche Brotsorten verfuegbar sind und koennen bis 8 Uhr vorbestellen.

## Features (MVP)

- **Kunden-Ansicht**: Brotsorten des Tages mit Mengenauswahl + Vorbestellung
- **Betreiberin-Modus**: PIN-gesichert (1234) — Brotsorten verwalten, Bestellungen einsehen
- **Bestellzeitraum**: Vorbestellungen nur bis 8:00 Uhr moeglich
- **Bestellbestaetigung**: Modal mit Zusammenfassung nach Absenden
- **PWA**: Installierbar auf iOS/Android, offline-faehig

## Tech Stack

- React 19 + Vite 8
- CSS Custom Properties (kein Framework)
- Service Worker (Cache-first)
- localStorage fuer Datenhaltung (Prototyp)

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Prototyp-Hinweise

- PIN fuer Betreiberin-Modus: **1234**
- Daten werden im localStorage gespeichert (nicht persistent zwischen Geraeten)
- Preise sind Platzhalter
- Admin-Modus: Header "Betreiberin" Button → PIN eingeben
