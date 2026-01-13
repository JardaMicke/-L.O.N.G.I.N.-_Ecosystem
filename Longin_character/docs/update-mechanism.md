# Update Mechanism Documentation

## Obsah
1. Přehled
2. Architektura
3. Backend implementace
4. Frontend implementace
5. Automatické aktualizace
6. Manuální aktualizace
7. Řešení problémů
8. Rozšíření a přizpůsobení

## 1. Přehled

Aktualizační mechanismus Candy AI Clone poskytuje způsob, jak distribuovat, stahovat a instalovat nové verze aplikace. Hlavními cíli jsou:

- Automatická kontrola dostupnosti nových verzí
- Bezpečné stahování aktualizací
- Zálohování dat před aktualizací
- Snadná instalace aktualizací
- Možnost obnovení předchozí verze v případě problémů

Mechanismus je implementován jako kombinace backend služby, která komunikuje s repozitářem GitHub, a frontend komponenty, která poskytuje uživatelské rozhraní.

## 2. Architektura

Aktualizační mechanismus se skládá z následujících komponent:

### Backend
- **update-service.js**: Služba pro kontrolu, stahování a přípravu aktualizací
- **routes/update-routes.js**: API endpointy pro aktualizační funkce

### Frontend
- **UpdateContext.js**: Context API pro správu stavu aktualizací
- **UpdateMechanism.js**: Komponenta pro zobrazení notifikací o aktualizacích
- **UpdateButton.js**: Tlačítko pro manuální kontrolu a instalaci aktualizací

### Electron
- Integrační vrstva mezi frontendem a operačním systémem pro instalaci aktualizací

## 3. Backend implementace

### update-service.js

Tato služba poskytuje hlavní funkcionalitu aktualizačního mechanismu:

- **checkForUpdates()**: Kontroluje dostupnost nových verzí na GitHubu
- **startDownload()**: Zahajuje stahování aktualizace
- **getDownloadProgress()**: Vrací průběh stahování
- **prepareUpdate()**: Připravuje aktualizaci k instalaci
- **createBackup()**: Vytváří zálohu před aktualizací
- **restoreFromBackup()**: Obnovuje aplikaci ze zálohy

### update-routes.js

API endpointy pro aktualizační funkce:

- **GET /api/update/check**: Kontrola dostupnosti aktualizací
- **POST /api/update/download**: Zahájení stahování aktualizace
- **GET /api/update/progress/:downloadId**: Získání průběhu stahování
- **POST /api/update/prepare/:downloadId**: Příprava aktualizace k instalaci
- **POST /api/update/ignore/:version**: Ignorování konkrétní verze
- **PUT /api/update/settings**: Aktualizace nastavení
- **GET /api/update/settings**: Získání nastavení
- **POST /api/update/restore**: Obnovení ze zálohy

## 4. Frontend implementace

### UpdateContext.js

Context API pro správu stavu aktualizací:

- Poskytuje stav aktualizací (dostupnost, informace, stahování)
- Poskytuje funkce pro kontrolu, stahování a instalaci aktualizací
- Umožňuje sdílení stavu mezi komponentami

### UpdateMechanism.js

Komponenta pro zobrazení notifikací o aktualizacích:

- Automaticky kontroluje dostupnost aktualizací
- Zobrazuje notifikaci, když je dostupná nová verze
- Poskytuje rozhraní pro stahování a instalaci aktualizací

### UpdateButton.js

Tlačítko pro manuální kontrolu a instalaci aktualizací:

- Umožňuje uživateli manuálně spustit kontrolu aktualizací
- Zobrazuje stav aktualizací (dostupná, stahování, chyba)
- Poskytuje přímý přístup k instalaci aktualizací

## 5. Automatické aktualizace

Aplikace automaticky kontroluje dostupnost aktualizací:

1. Při spuštění aplikace
2. V pravidelných intervalech (konfigurovatelné)

Když je nalezena nová verze:

1. Zobrazí se notifikace s informacemi o nové verzi
2. Uživatel může stáhnout a nainstalovat aktualizaci
3. V závislosti na nastavení může být aktualizace stažena automaticky

## 6. Manuální aktualizace

Uživatel může také manuálně kontrolovat a instalovat aktualizace:

1. Kliknutím na tlačítko "Zkontrolovat aktualizace" v nastavení
2. Kliknutím na tlačítko "Aktualizovat" v notifikaci
3. Použitím Update Button komponenty umístěné v aplikaci

## 7. Řešení problémů

### Chyba stahování
- Zkontrolujte připojení k internetu
- Zkontrolujte, zda máte dostatek místa na disku
- Zkuste stáhnout aktualizaci znovu

### Chyba instalace
- Zkontrolujte, zda máte dostatečná oprávnění
- Ukončete všechny instance aplikace
- Zkuste obnovit aplikaci ze zálohy

### Obnovení ze zálohy
1. Přejděte do nastavení aplikace
2. Vyberte "Obnovit ze zálohy"
3. Vyberte zálohu, ze které chcete obnovit

## 8. Rozšíření a přizpůsobení

### Konfigurace aktualizačního mechanismu

Nastavení aktualizačního mechanismu lze změnit v konfiguraci:

```json
{
  "autoCheck": true,         // Automatická kontrola aktualizací
  "autoDownload": false,     // Automatické stahování aktualizací
  "checkInterval": 3600000,  // Interval kontroly (ms)
  "updateChannel": "stable"  // Kanál aktualizací (stable, beta)
}
```

### Přidání vlastního zdroje aktualizací

Aktualizační mechanismus je navržen pro použití s GitHub Releases, ale můžete implementovat vlastní zdroj aktualizací úpravou `update-service.js`:

1. Upravte metodu `checkForUpdates()` pro komunikaci s vaším serverem
2. Upravte formát aktualizačních informací podle potřeby
3. Implementujte vlastní logiku stahování a ověřování aktualizací

### Vlastní aktualizační UI

Můžete vytvořit vlastní UI pro aktualizace:

1. Použijte `useUpdateContext()` hook pro přístup k aktualizačnímu stavu a funkcím
2. Vytvořte vlastní komponentu pro zobrazení aktualizací
3. Integrujte ji do vaší aplikace