# Dokumentace webového instalátoru Candy AI Clone

## Přehled

Webový instalátor Candy AI Clone je komplexní řešení pro instalaci aplikace bez nutnosti kompilace. Sestává ze dvou hlavních komponent:
- `install.html` - Webové rozhraní s formulářem
- `web-install.bat` - Spouštěcí skript pro Windows

## Architektura

### 1. Frontend (install.html)

#### Hlavní komponenty:
- **Formulář pro konfiguraci** - Umožňuje uživateli zadat všechny potřebné údaje
- **Validační systém** - Kontroluje správnost zadaných údajů
- **API komunikace** - Komunikuje s Node.js serverem (pokud je k dispozici)
- **Simulace instalace** - Poskytuje funkčnost i bez API

#### Klíčové funkce:

##### checkApiAvailability()
```javascript
async function checkApiAvailability()
```
- **Účel**: Zjišťuje, zda je k dispozici API pro komunikaci s Node.js serverem
- **Návratová hodnota**: Nastavuje globální proměnnou `isApiAvailable`
- **Použití**: Určuje, zda lze používat pokročilé funkce (procházení souborů, skutečná instalace)

##### validateForm()
```javascript
function validateForm()
```
- **Účel**: Validuje všechna pole formuláře
- **Kontroluje**:
  - Výběr typu zdroje souborů
  - Existenci potřebných cest
  - Správnost formátu souborů (ZIP)
- **Výstup**: Povoluje/zakazuje tlačítko instalace

##### executeCommand(command)
```javascript
async function executeCommand(command)
```
- **Parametry**: `command` (string) - příkaz k vykonání
- **Účel**: Spouští příkazy přes API na serveru
- **Návratová hodnota**: JSON objekt s výsledkem příkazu
- **Chybové stavy**: Vyhodí chybu, pokud API není dostupné

##### performInstallation()
```javascript
async function performInstallation()
```
- **Účel**: Řídí celý proces instalace
- **Kroky**:
  1. Příprava instalačního adresáře
  2. Extrakce/kopírování zdrojových souborů
  3. Instalace Node.js závislostí
  4. Konfigurace aplikace
  5. Vytvoření zástupců
  6. Finální nastavení

#### Systém logování:

##### logMessage(message, type)
```javascript
function logMessage(message, type = 'info')
```
- **Parametry**: 
  - `message` (string) - zpráva k zalogování
  - `type` (string) - typ zprávy ('info', 'error', 'success', 'warning')
- **Účel**: Zaznamenává průběh instalace
- **Funkčnost**: Ukládá do pole a zobrazuje v UI

#### Konfigurace a nastavení:

##### getInstallationConfig()
```javascript
function getInstallationConfig()
```
- **Návratová hodnota**: Objekt s kompletní konfigurací instalace
- **Struktura**:
  ```javascript
  {
    sourceType: string,      // 'zip', 'folder', 'github'
    sourceFolder: string,    // cesta ke složce se zdroji
    githubRepo: string,      // URL GitHub repozitáře
    installPath: string,     // cesta pro instalaci
    ollamaPath: string,      // cesta k Ollama
    lmStudioPath: string,    // cesta k LM Studio
    installDocker: boolean,  // instalovat Docker kontejnery
    createShortcuts: boolean, // vytvořit zástupce
    autoStart: boolean,      // spustit po instalaci
    zipFile: File           // vybraný ZIP soubor
  }
  ```

### 2. Backend Server (web-install.bat)

#### Hlavní funkcionalita:
- **Detekce Node.js** - Kontroluje dostupnost Node.js
- **Režimy fungování**:
  - **Základní** - Pouze otevření HTML v prohlížeči
  - **Pokročilý** - Vytvoření HTTP serveru s API

#### Struktura serveru:
```javascript
const server = http.createServer((req, res) => {
  // Obsluha API endpointů
  if (req.url.startsWith('/api/')) {
    // /api/execute-command - spouštění příkazů
  }
  
  // Obsluha statických souborů
  // Automatické určení MIME typu
  // Obsluha chyb 404 a 500
});
```

#### API Endpointy:

##### POST /api/execute-command
- **Účel**: Spouští příkazy příkazového řádku
- **Vstup**: JSON objekt s polem `command`
- **Výstup**: 
  ```javascript
  {
    success: boolean,
    stdout: string,
    stderr: string,
    error: string|null
  }
  ```
- **Bezpečnost**: Přijímá pouze POST požadavky

## Instalační proces

### Fáze 1: Příprava (5-15%)
- Vytvoření instalačního adresáře
- Kontrola existující instalace
- Požádání o potvrzení přepsání

### Fáze 2: Extrakce souborů (15-30%)
- **ZIP soubor**: Extrakce do cílového adresáře
- **Složka**: Kopírování souborů pomocí xcopy
- **GitHub**: Klonování repozitáře pomocí git

### Fáze 3: Instalace závislostí (30-60%)
- Kontrola Node.js
- Instalace backend závislostí (`npm install --production`)
- Instalace frontend závislostí (`npm install`)

### Fáze 4: Konfigurace (60-80%)
- Vytvoření konfiguračních souborů
- Ověření cest k Ollama a LM Studio
- Nastavení environment proměnných

### Fáze 5: Zástupce a spouštěče (80-95%)
- Vytvoření desktop zástupce
- Generování spouštěcího skriptu
- Konfigurace Start Menu

### Fáze 6: Finalizace (95-100%)
- Konfigurace Docker kontejnerů (volitelně)
- Vytvoření logu instalace
- Automatické spuštění (volitelně)

## Spouštěcí skripty

### launch-candy-ai.bat
Základní spouštěč pro frontend:
```batch
@echo off
echo Starting Candy AI Clone...
cd /d "INSTALL_PATH\frontend"
npm start
pause
```

### start-candy-ai.bat
Kompletní spouštěč všech služeb:
```batch
@echo off
title Candy AI Clone Launcher

:: Spuštění Ollama serveru
start "Ollama Server" "OLLAMA_PATH" serve

:: Spuštění backend serveru
cd /d "INSTALL_PATH\backend"
start "Candy AI Backend" cmd /c "npm start"

:: Spuštění frontend aplikace
cd /d "INSTALL_PATH\frontend"
start "Candy AI Frontend" cmd /c "npm start"

:: Čekání na ukončení
pause

:: Ukončení všech služeb
taskkill /F /FI "WINDOWTITLE eq Candy AI*"
```

## Konfigurace Docker

Pokud je zvolena možnost Docker instalace:
1. Kontrola dostupnosti Docker
2. Navigace do `docker/` adresáře
3. Spuštění `docker-compose up -d`
4. Logování výsledku

## Chybové stavy a jejich řešení

### Chyba: Node.js není k dispozici
- **Detekce**: `node --version` selže
- **Řešení**: Požádání uživatele o instalaci Node.js
- **Fallback**: Pokračování v základním režimu

### Chyba: Git není k dispozici (pro GitHub)
- **Detekce**: `git --version` selže
- **Řešení**: Zobrazení chyby a návod na instalaci Git
- **Fallback**: Přepnutí na manuální stahování

### Chyba: Ollama/LM Studio nenalezeno
- **Detekce**: `if exist "path"` kontrola
- **Řešení**: Varování v logu, pokračování instalace
- **Následek**: Některé funkce nemusí fungovat

### Chyba: Nedostatečná oprávnění
- **Detekce**: Selhání vytvoření adresáře nebo kopírování
- **Řešení**: Požádání o spuštění jako administrátor
- **Fallback**: Výběr jiného instalačního adresáře

## Bezpečnostní aspekty

### Validace vstupů
- Kontrola formátu cest
- Ověření typu souborů (pouze .zip)
- Sanitizace příkazů před spuštěním

### Ochrana před path traversal
- Kontrola, že cesty neobsahují ".."
- Omezení na platné Windows cesty
- Validace existence rodičovských adresářů

### Spouštění příkazů
- Pouze whitelistované příkazy
- Escape speciálních znaků
- Timeout pro dlouho běžící operace

## Rozšiřitelnost

### Přidání nového typu zdroje
1. Rozšíření `sourceType` selectu
2. Přidání nové form group
3. Implementace logiky v `extractSourceFiles()`
4. Aktualizace validace v `validateForm()`

### Přidání nové konfigurace
1. Rozšíření formuláře o nové pole
2. Aktualizace `getInstallationConfig()`
3. Implementace v `configureApplication()`
4. Přidání do `createConfigFile()`

### Přidání nového API endpointu
1. Rozšíření serveru v `web-install.bat`
2. Přidání JavaScript funkce pro volání
3. Aktualizace error handlingu
4. Dokumentace nového endpointu

## Testování

### Manuální testování
1. Test v základním režimu (bez Node.js)
2. Test s Node.js serverem
3. Test všech typů zdrojů (ZIP, složka, GitHub)
4. Test chybových stavů
5. Test na různých verzích Windows

### Automatizované testování
```javascript
// Příklad unit testu pro validaci
function testValidateForm() {
  // Nastavení testovacích dat
  sourceType.value = 'zip';
  selectedZipFile = new File(['test'], 'test.zip');
  document.getElementById('installPath').value = 'C:\\test';
  document.getElementById('ollamaPath').value = 'C:\\ollama.exe';
  
  // Spuštění validace
  validateForm();
  
  // Ověření výsledku
  assert(!installBtn.disabled, 'Tlačítko by mělo být povoleno');
}
```

## Ladění a diagnostika

### Úrovně logování
- **INFO**: Standardní průběh operace
- **WARNING**: Neočekávané stavy, pokračování možné
- **ERROR**: Chyby zastavující instalaci
- **SUCCESS**: Úspěšné dokončení kroku

### Debug informace
- Verze Node.js
- Dostupnost jednotlivých komponent
- Cesty k souborům a jejich existence
- Výstupy spuštěných příkazů

### Log soubory
- **Instalační log**: `logs/installation_log.txt`
- **Konfigurační soubor**: `config/settings.ini`
- **Runtime log**: Výstup z jednotlivých služeb

## Údržba a aktualizace

### Aktualizace webového instalátoru
1. Aktualizace `install.html` s novými funkcemi
2. Testování kompatibility s existujícími instalacemi
3. Aktualizace dokumentace

### Přidání podpory pro nové platformy
1. Detekce platformy v JavaScriptu
2. Podmíněné spouštění platformově-specifických příkazů
3. Aktualizace spouštěcích skriptů

## Známé problémy a omezení

### Současná omezení
1. **File API**: Nemožnost přímého přístupu k souborům z prohlížeče
2. **Cross-origin**: Omezení při přístupu k lokálním souborům
3. **Oprávnění**: Potřeba administrátorských práv pro některé operace

### Plánovaná vylepšení
1. Podpora pro Linux a macOS
2. Grafické rozhraní pro výběr cest
3. Automatická detekce existujících instalací
4. Pokročilá diagnostika systému