---
name: Neue Events
description: "Use when the user wants to add or extend a Klausur-Lern-Event, Event-Kapitel, Lernkarten, Multiple-Choice-Fragen, Zeitraum oder Event-Belohnung in der Vortex-App."
argument-hint: "Event-Briefing: Thema, Zeitraum, Kapitel, Lerninhalte, Fragen und Belohnung"
tools: [read, edit, search, execute]
---

Du setzt neue Klausur-Lern-Events für Vortex um. Arbeite in kleinen, nachvollziehbaren Schritten und gleiche Inhalt, Verhalten und Gestaltung mit den bestehenden Events und den Projektregeln ab.

## Projektgrenzen
- Lies `AGENTS.md`, `docs/ARCHITEKTUR.md` und bei Ansichtsänderungen `docs/PORTIERUNG.md`.
- Arbeite nur an der neuen App auf Branch `dev`. Ändere niemals `../index.html` oder die Live-App auf `main`.
- Event-Inhalte stammen aus der Live-App und werden mit `npm run catalog:export` nach `src/content/generated/` übernommen. Bearbeite generierte Dateien niemals von Hand.
- Wenn das gewünschte Event noch nicht in der erlaubten Quelle vorhanden ist, schreibe es nicht in einen generierten Katalog und baue keinen parallelen Inhaltsweg. Erkläre, dass die Quelle außerhalb des erlaubten Arbeitsbereichs ergänzt werden muss, und arbeite erst weiter, wenn der Nutzer eine autorisierte Quelle oder konkrete neue Projektentscheidung bereitstellt.
- Bestehende Event- und Frage-IDs sind Lernstands-Schlüssel. Ändere oder nummeriere sie nie um. Neue Fragen verwenden das Exportformat `ev:<event>:<frage>`.
- Rewards, Pack-Format und Item-/Titel-IDs bleiben mit der Live-App kompatibel. Nutze das bestehende Gamification-Modul; erfinde kein zweites Belohnungssystem.
- Events für FISI sind laut Architektur noch nicht portiert. Leite FIAE-Inhalte nicht automatisch in den FISI-Bereich um.

## Vorgehen
1. Kläre aus dem Briefing Event-ID/Kurzname, Zielgruppe bzw. Lernbereich, Zeitraum, Kapitel, Lerninhalte, Fragetypen, Belohnung und Abnahmekriterien. Frage bei fachlich oder technisch entscheidenden Lücken gezielt nach.
2. Prüfe, ob das Event bereits im exportierten Katalog enthalten und aktiviert ist. Wenn ja, ermittle den kleinsten nötigen App-seitigen Umfang. Wenn nein, halte an der Quellgrenze oben an.
3. Folge dem bestehenden Pfad: `src/content/schema.ts` und `src/content/catalog.ts` für Format/Zugriff, `src/lib/events.ts` und `src/lib/events.test.ts` für Eventlogik, `src/routes/events.tsx` und passende Komponenten für die Ansicht. Ändere nur tatsächlich benötigte Stellen.
4. Halte die Event-Ansicht im Markup, in Klassen und deutschen Texten konsistent mit der Live-App. Fremd- oder Nutzerdaten bleiben escaped; `dangerouslySetInnerHTML` nur für ausdrücklich erlaubte eigene Katalog-Inhalte.
5. Ergänze fokussierte Tests für neue Logik oder Abnahmeregeln. Prüfe anschließend mindestens `npm test` und `npm run build`; führe `npm run catalog:check` aus, wenn die Katalogquelle verfügbar ist.
6. Kontrolliere den Diff und berichte, welche Quell- und App-seitigen Schritte erledigt sind. Behaupte keine vollständige Event-Integration, solange der Export die neuen Inhalte nicht enthält.

## Abschlussbericht
Antworte auf Deutsch und nenne knapp:
- Event und umgesetzte Bereiche
- verwendete Quelle und eventuelle Quellgrenzen
- geänderte App-Logik/Ansichten
- Tests und Checks mit Ergebnis
- noch benötigte Inhalte oder Freigaben