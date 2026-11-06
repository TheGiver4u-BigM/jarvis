# J.A.R.V.I.S. einrichten (Version 3)

Alles läuft kostenlos über **GitHub**. GitHub stellt die App online (GitHub Pages) und startet die automatischen Berichte (GitHub Actions). Du brauchst keinen eigenen Server.

---

## 🔐 So ist Jarvis geschützt

| Schutz | Was es bedeutet |
|---|---|
| **PIN-Sperre** | Jarvis öffnet sich nur mit deiner PIN (6–12 Ziffern). Nach 5 Fehlversuchen wird die Wartezeit immer länger. |
| **Verschlüsselter Tresor** | Alle Schlüssel und Aufgaben liegen mit AES-256 verschlüsselt auf dem Handy. Ohne PIN sind sie unlesbar, auch bei Zugriff auf den Speicher. |
| **Auto-Sperre** | Nach 5 Minuten im Hintergrund oder 10 Minuten ohne Bedienung sperrt sich Jarvis. 🔒 oben rechts sperrt sofort. |
| **Gmail nur lesen** | Jarvis bekommt nur die Berechtigung `gmail.readonly`. Er kann **keine Mails senden, löschen oder ändern**. |
| **Nichts auf dem Sperrbildschirm** | Bei Mail-Meldungen steht dort nur „wichtige E-Mail – in Jarvis öffnen“. Die Details siehst du erst nach der PIN. |
| **Verschlüsselte Push-Nachrichten** | Berichte gehen Ende-zu-Ende verschlüsselt direkt aufs Handy. |
| **Keine Mail-Inhalte gespeichert** | Der E-Mail-Wächter merkt sich nur unkenntliche Prüfsummen bereits geprüfter Mails. Mail-Inhalte erscheinen nicht in den GitHub-Protokollen. |
| **Schutz vor manipulierten Mails** | Jarvis behandelt Mail-Inhalte nur als Daten und befolgt keine Anweisungen daraus. Bei Phishing-Verdacht warnt er dich. |
| **Sicherheitsregeln der Webseite** | Die App darf nur mit den festgelegten Diensten sprechen (Anthropic, Wetter, Finnhub, Google). |

**Wer kann was?** Andere Leute können den Link zwar öffnen, sehen aber nur den Sperrbildschirm und kommen ohne PIN nicht weiter. Selbst wenn sie dort eine eigene PIN anlegen, ist das ein leeres Jarvis auf *ihrem* Gerät, ohne deine Schlüssel und ohne Zugriff auf deine Mails.

**Gut zu wissen:** Für die Zusammenfassungen werden Absender, Betreff und Vorschau deiner Mails an die Anthropic-API geschickt. Anthropic nutzt API-Daten standardmäßig nicht zum Training.

---

## Teil 1: Schlüssel besorgen

| Schlüssel | Wo | Kosten |
|---|---|---|
| **Anthropic** | console.anthropic.com → „API Keys“ → „Create Key“, Guthaben aufladen | Pro Nutzung, wenige Euro im Monat |
| **Finnhub** | finnhub.io → „Get free API key“ | Kostenlos |
| **Push-Schlüssel** | Schon fertig: **GEHEIM-push-schluessel.txt** (liegt neben dem Ordner `jarvis`) | Kostenlos |
| **Gmail-Zugang** | Siehe Teil 4 | Kostenlos |

---

## Teil 2: App auf GitHub stellen

1. Auf **github.com** ein kostenloses Konto anlegen. Schalte gleich unter Settings → Password and authentication die **Zwei-Faktor-Anmeldung** ein, sie schützt deine Secrets.
2. **+** → **New repository** wählen. Als Name `jarvis` eintragen, **Public** auswählen, dann **Create repository**.
3. Auf **„uploading an existing file“** klicken und den **Inhalt** des Ordners `jarvis` hineinziehen: alle Dateien plus die Ordner `server` und `.github`. Danach **Commit changes**.
   - Fehlt `.github` nach dem Hochladen, lege die beiden Dateien über **Add file → Create new file** an. Die Namen sind `.github/workflows/jarvis.yml` und `.github/workflows/mail.yml`, als Inhalt jeweils die gleichnamige Datei.
4. **Settings → Pages** öffnen, bei Branch `main` und `/ (root)` wählen und auf **Save** tippen. Die App ist danach erreichbar unter `https://DEIN-NAME.github.io/jarvis/`.

---

## Teil 3: Aufs Samsung installieren

1. Den Link in **Chrome** öffnen, dann **⋮** → **„App installieren“** tippen.
2. Jarvis öffnen und eine **PIN festlegen**. Nimm keine leichte wie 123456 oder dein Geburtsdatum.
3. Auf **⚙** tippen, die Anthropic- und Finnhub-Schlüssel eintragen und **Speichern**.
4. Unter **⚙ → Stimme** die Stimme aussuchen und Tonhöhe und Tempo einstellen. Mit „Probe hören“ kannst du sie testen. Für den Butler-Klang: tiefe männliche Stimme, Tonhöhe etwa 0.8, Tempo etwa 0.95.
5. Unter **⚙ → 🔔 Push aktivieren** tippen und den Code kopieren. Er wird in Teil 5 gebraucht.

---

## Teil 4: Gmail-Zugang einrichten (einmalig, ca. 15 Minuten)

### A) Google-Projekt anlegen
1. **console.cloud.google.com** öffnen und mit deinem Gmail-Konto anmelden.
2. Oben auf **Projekt auswählen → Neues Projekt** gehen, Name `Jarvis`, dann **Erstellen**.
3. Links im Menü **APIs & Dienste → Bibliothek** öffnen, nach **Gmail API** suchen und auf **Aktivieren** tippen.

### B) Zustimmungsbildschirm
1. **APIs & Dienste → OAuth-Zustimmungsbildschirm** (bzw. „Google Auth Platform“) öffnen.
2. App-Name `Jarvis` eintragen, als Support-Mail deine eigene Adresse, Zielgruppe **Extern**.
3. Unter **Datenzugriff / Bereiche** den Bereich `https://www.googleapis.com/auth/gmail.readonly` hinzufügen.
4. Unter **Zielgruppe / Testnutzer** deine Gmail-Adresse eintragen.
5. Auf **App veröffentlichen** („In Produktion“) tippen. Das ist wichtig, denn im Testmodus verfällt der Zugang nach 7 Tagen. Eine Überprüfung durch Google brauchst du nicht, weil nur du die App nutzt.

### C) Zugangsdaten erstellen
1. **APIs & Dienste → Anmeldedaten → Anmeldedaten erstellen → OAuth-Client-ID** öffnen.
2. Als Typ **Webanwendung** wählen, Name `Jarvis`.
3. Unter **Autorisierte Weiterleitungs-URIs** `https://developers.google.com/oauthplayground` eintragen.
4. Auf **Erstellen** tippen und dir **Client-ID** und **Clientschlüssel (Secret)** notieren.

### D) Refresh-Token holen
1. **developers.google.com/oauthplayground** öffnen.
2. Oben rechts auf ⚙ tippen, **„Use your own OAuth credentials“** anhaken und Client-ID und Secret eintragen.
3. Links unten in das Feld `https://www.googleapis.com/auth/gmail.readonly` eintragen und **Authorize APIs** tippen.
4. Mit deinem Gmail-Konto anmelden. Google warnt: „Google hat diese App nicht überprüft“. Das ist normal, weil es deine eigene App ist. Tippe auf **Erweitert → Zu Jarvis wechseln** und erlaube den Lesezugriff.
5. Auf **Exchange authorization code for tokens** tippen und den **Refresh token** kopieren.

### E) In Jarvis eintragen
In der App unter **⚙ → Gmail** Client-ID, Secret und Refresh-Token eintragen. Dann **Verbindung testen** tippen, es sollte „✓ Verbunden mit …“ erscheinen. Danach **Speichern**.

> Zugang jederzeit widerrufen: myaccount.google.com → Sicherheit → Drittanbieter-Apps → Jarvis → Zugriff entfernen.

---

## Teil 5: GitHub-Secrets eintragen

Im Repository **Settings → Secrets and variables → Actions → New repository secret** öffnen und diese Secrets anlegen:

| Name | Inhalt |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic-Schlüssel |
| `FINNHUB_API_KEY` | Finnhub-Schlüssel |
| `VAPID_PUBLIC_KEY` | aus GEHEIM-push-schluessel.txt |
| `VAPID_PRIVATE_KEY` | aus GEHEIM-push-schluessel.txt |
| `PUSH_SUBSCRIPTION` | Push-Code vom Handy (Teil 3) |
| `GMAIL_CLIENT_ID` | aus Teil 4 C |
| `GMAIL_CLIENT_SECRET` | aus Teil 4 C |
| `GMAIL_REFRESH_TOKEN` | aus Teil 4 D |

Secrets sind verschlüsselt. Niemand kann sie lesen, auch du nicht mehr, und sie tauchen nie in den Protokollen auf.
Optional kannst du unter **Variables** die Variable `WATCHLIST` anlegen, z. B. `TTWO,NVDA,AMD`.

---

## Teil 6: Testen

Bei GitHub unter **Actions** startest du jeden Ablauf mit **Run workflow** auch manuell:
- **Jarvis Berichte** → `briefing` bzw. `woche`
- **Jarvis E-Mail-Wächter**

Danach läuft alles von allein:
- **Täglich gegen 7 Uhr:** Briefing mit Wetter, wichtigen Mails, Aktien und Marktlage
- **Sonntags gegen 18 Uhr:** Aktien-Wochenbericht mit breiter Recherche und ETF-Ideen
- **Alle 30 Minuten (6–23 Uhr):** Meldung, sobald eine wirklich wichtige Mail kommt. Nachts gehen keine Meldungen raus. Was nachts eintrifft, meldet Jarvis morgens.

In der App kannst du außerdem fragen: „Gibt es wichtige Mails?“, „Hat mir die Sparkasse geschrieben?“ oder „Lies mir die Mail von Herrn Müller vor.“

---

## Gut zu wissen

- **60-Tage-Regel:** Gibt es 60 Tage lang keine Änderung im Repository, pausiert GitHub die Zeitpläne und schickt dir eine Mail. Dann reicht ein Klick auf „Enable workflow“.
- **PIN vergessen:** Über „PIN vergessen?“ setzt du Jarvis zurück. Danach musst du die Schlüssel neu eintragen.
- **Neues Handy:** PIN festlegen, Schlüssel eintragen, Push neu aktivieren und das Secret `PUSH_SUBSCRIPTION` ersetzen.
- **GEHEIM-push-schluessel.txt** an niemanden weitergeben und nicht hochladen.
- **Aktien:** Die Einschätzungen sind KI-Analysen, **keine Anlageberatung**. Jarvis handelt nicht selbst.
