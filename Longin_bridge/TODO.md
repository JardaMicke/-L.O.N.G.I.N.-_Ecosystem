# TODO

Tento soubor sleduje postup vývoje aplikace.

## Fáze 1: Základní Funkcionalita (Hotovo)

- [x] Vytvoření základní struktury aplikace (Flask, Socket.IO, základní frontend).
- [x] Implementace zjišťování peer-to-peer spojení.
- [x] Přidání funkcionality pro přidávání a zobrazování vlastních služeb.
- [x] Implementace vytváření a zobrazování sdílených složek.
- [x] Aktualizace seznamu sdílených složek v reálném čase.

## Fáze 2: Chat s LLM

- [ ] **Backend:** Vytvořit nový koncový bod Socket.IO pro zpracování zpráv chatu.
- [ ] **Backend:** Integrovat s API velkého jazykového modelu (např. OpenAI nebo lokální model přes API).
- [ ] **Backend:** Zpracovávat příchozí zprávy, posílat je do LLM a vysílat odpověď.
- [ ] **Frontend:** Přidat chatovací okno do uživatelského rozhraní v `index.html`.
- [ ] **Frontend:** nastylovat chatovací okno v `styles.css`.
- [ ] **Frontend:** Implementovat logiku v JavaScriptu (`app.js`) pro odesílání a přijímání zpráv chatu.
- [ ] **Frontend:** Zobrazovat konverzaci v chatovacím okně.

## Fáze 3: Nasazení a Dokončení

- [ ] Důkladně otestovat všechny funkce.
- [ ] Vytvořit soubor `README.md` s instrukcemi pro nastavení a použití.
- [ ] Připravit aplikaci pro produkční nasazení.