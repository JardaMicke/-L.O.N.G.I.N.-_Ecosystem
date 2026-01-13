# Instalační příručka Candy AI Clone

## Obsah
1. Systémové požadavky
2. Instalace na Windows
3. Instalace na macOS
4. Instalace na Linux
5. Docker instalace
6. Nastavení AI modelů
7. Řešení problémů
8. Update

## 1. Systémové požadavky

### Minimální požadavky
- **OS**: Windows 10/11 (64-bit), macOS 11+, Ubuntu 20.04+
- **CPU**: 4-jádrový procesor
- **RAM**: 8 GB
- **Disk**: 10 GB volného místa
- **GPU**: Není vyžadována, ale doporučená pro rychlejší generování

### Doporučené požadavky
- **OS**: Windows 11 (64-bit), macOS 12+, Ubuntu 22.04+
- **CPU**: 8-jádrový procesor
- **RAM**: 16 GB
- **Disk**: 20 GB volného místa (SSD)
- **GPU**: NVIDIA s 6+ GB VRAM pro lokální AI modely

## 2. Instalace na Windows

### Automatická instalace (doporučeno)
1. Stáhněte nejnovější instalační soubor `CandyAIClone-Setup-x64.exe` z [oficiálních stránek](https://github.com/username/candy-ai-clone/releases)
2. Spusťte stažený instalační soubor
3. Postupujte podle pokynů v instalačním průvodci
4. Po dokončení instalace spusťte aplikaci z nabídky Start nebo vytvořeného zástupce

### Manuální instalace
1. Stáhněte ZIP archiv `CandyAIClone-Windows-x64.zip`
2. Rozbalte archiv do požadované složky
3. Nainstalujte Docker Desktop z [oficiálních stránek](https://www.docker.com/products/docker-desktop)
4. Spusťte `setup.bat` pro inicializaci prostředí
5. Spusťte aplikaci pomocí `CandyAIClone.exe`

## 3. Instalace na macOS

### Automatická instalace
1. Stáhněte nejnovější DMG soubor `CandyAIClone-x64.dmg` z [oficiálních stránek](https://github.com/username/candy-ai-clone/releases)
2. Otevřete stažený DMG soubor
3. Přetáhněte aplikaci Candy AI Clone do složky Applications
4. Spusťte aplikaci z Launchpadu nebo složky Applications

### Manuální instalace
1. Stáhněte ZIP archiv `CandyAIClone-macOS-x64.zip`
2. Rozbalte archiv do požadované složky
3. Nainstalujte Docker Desktop z [oficiálních stránek](https://www.docker.com/products/docker-desktop)
4. Otevřete Terminal a přejděte do rozbalené složky
5. Spusťte `./setup.sh` pro inicializaci prostředí
6. Spusťte aplikaci pomocí `open CandyAIClone.app`

## 4. Instalace na Linux

### Ubuntu/Debian
1. Stáhněte nejnovější DEB balíček `candy-ai-clone_x.x.x_amd64.deb`
2. Nainstalujte balíček:
   ```bash
   sudo apt install ./candy-ai-clone_x.x.x_amd64.deb
   ```
3. Nainstalujte Docker a Docker Compose:
   ```bash
   sudo apt install docker.io docker-compose
   ```
4. Spusťte aplikaci z nabídky aplikací nebo pomocí příkazu:
   ```bash
   candy-ai-clone
   ```

### Arch Linux
1. Stáhněte nejnovější AUR balíček `candy-ai-clone`
2. Nainstalujte balíček:
   ```bash
   yay -S candy-ai-clone
   ```
3. Nainstalujte Docker a Docker Compose:
   ```bash
   sudo pacman -S docker docker-compose
   ```
4. Spusťte aplikaci z nabídky aplikací nebo pomocí příkazu:
   ```bash
   candy-ai-clone
   ```

## 5. Docker instalace

Pro pokročilé uživatele, kteří chtějí používat pouze backendovou část aplikace:

1. Naklonujte repozitář:
   ```bash
   git clone https://github.com/username/candy-ai-clone.git
   cd candy-ai-clone
   ```

2. Spusťte Docker Compose:
   ```bash
   cd docker
   docker-compose up -d
   ```

3. Spusťte backend server:
   ```bash
   cd ../backend
   npm install
   npm start
   ```

4. Přístup k API je na adrese `http://localhost:3000/api`

## 6. Nastavení AI modelů

### Automatické nastavení
Po první instalaci aplikace automaticky stáhne a nastaví potřebné AI modely:

1. Dolphin-Mistral (výchozí model pro konverzace)
2. WizardLM-Uncensored (alternativní model pro role-playing)

### Manuální nastavení modelů
Pro pokročilé uživatele, kteří chtějí používat vlastní modely:

1. Otevřete nastavení aplikace
2. Přejděte na záložku "AI Models"
3. Klikněte na "Add Custom Model"
4. Zadejte cestu k vlastnímu modelu nebo URL pro stažení
5. Klikněte na "Import"

### Konfigurace Stable Diffusion
Pro generování obrázků:

1. V nastavení přejděte na záložku "Image Generation"
2. Vyberte preferovaný model (výchozí je "stable-diffusion-v1-5")
3. Upravte parametry podle potřeby (steps, CFG Scale, atd.)

## 7. Řešení problémů

### Docker problémy
- **Docker služby se nespustí**:
  ```bash
  # Restartujte Docker službu
  sudo systemctl restart docker
  
  # Zkontrolujte logy
  cd docker
  docker-compose logs
  ```

- **Port konflikty**:
  Upravte porty v souboru `docker/docker-compose.yml`, pokud máte konflikty s jinými službami

### AI modely
- **Modely se nestáhnou**:
  ```bash
  # Manuální stažení modelů
  cd docker
  docker-compose exec ollama pull dolphin-mistral
  docker-compose exec ollama pull wizardlm-uncensored
  ```

- **Vysoká spotřeba RAM**:
  V nastavení aplikace snižte velikost kontextu a parametr "max_tokens"

### Databáze
- **Problémy s databází**:
  ```bash
  # Reset databáze (ztratíte všechna data)
  cd backend
  npm run reset-db
  ```

## 8. Update

### Automatický update
Aplikace automaticky kontroluje dostupnost nových verzí. Pokud je k dispozici nová verze:

1. Zobrazí se oznámení o nové verzi
2. Klikněte na "Update Now"
3. Aplikace stáhne a nainstaluje aktualizaci
4. Restartujte aplikaci pro dokončení aktualizace

### Manuální update
Pro manuální aktualizaci:

1. Stáhněte nejnovější verzi z [oficiálních stránek](https://github.com/username/candy-ai-clone/releases)
2. Odinstalujte stávající verzi (data zůstanou zachována)
3. Nainstalujte novou verzi
4. Spusťte aplikaci

### Update Docker kontejnerů
Pro aktualizaci Docker kontejnerů:

```bash
cd docker
docker-compose pull
docker-compose down
docker-compose up -d
```