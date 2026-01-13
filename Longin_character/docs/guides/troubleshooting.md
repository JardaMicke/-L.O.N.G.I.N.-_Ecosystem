# Troubleshooting Guide - Řešení problémů

Tento průvodce obsahuje řešení nejčastějších problémů, se kterými se můžete setkat při používání aplikace.

## Problémy s instalací

### Chyba při instalaci Docker kontejnerů

**Problém**: Docker kontejnery se nespustí nebo dochází k chybám při inicializaci.

**Řešení**:

1. Zkontrolujte, zda máte dostatečná oprávnění pro spuštění Docker příkazů
2. Ověřte, že máte nejnovější verzi Docker a Docker Compose
3. Zkontrolujte logy kontejnerů pro podrobnější informace o chybě:

```bash
docker-compose logs -f
```

4. Ujistěte se, že žádný jiný proces nepoužívá stejné porty (3000, 11434, 7860, 6379, 5002)
5. Restartujte Docker službu a zkuste znovu

### Problémy s instalací Node.js závislostí

**Problém**: Chyby při instalaci npm balíčků.

**Řešení**:

1. Smažte adresář `node_modules` a soubor `package-lock.json`
2. Ujistěte se, že používáte správnou verzi Node.js (doporučeno 18.x)
3. Spusťte instalaci znovu:

```bash
npm cache clean --force
npm install
```

4. Pokud problémy přetrvávají, zkuste použít Docker setup místo lokální instalace

## Problémy s AI modely

### Model se nenačítá nebo není dostupný

**Problém**: LLM model se nenačte nebo API vrací chyby o nedostupnosti modelu.

**Řešení**:

1. Zkontrolujte, zda byl model úspěšně stažen:

```bash
docker exec -it candy-ollama ollama list
```

2. Pokud model není v seznamu, stáhněte ho znovu:

```bash
docker exec -it candy-ollama ollama pull dolphin-mistral
```

3. Zkontrolujte logy Ollama kontejneru:

```bash
docker-compose logs ollama
```

4. Ujistěte se, že máte dostatek RAM (minimálně 8GB) a volného místa na disku
5. Restartujte Ollama kontejner a backend službu:

```bash
docker-compose restart ollama backend
```

### Pomalé generování odpovědí

**Problém**: AI odpovědi jsou generovány velmi pomalu.

**Řešení**:

1. Pokud máte NVIDIA GPU, ujistěte se, že Docker kontejnery používají GPU akceleraci
2. Zkontrolujte vytížení systému během generování:

```bash
docker stats
```

3. Zkuste použít menší model nebo snížit parametry modelu (temperature, top_p)
4. Upravte hodnotu `max_tokens` pro generování kratších odpovědí
5. Zkontrolujte, zda v prompt nejsou zbytečně dlouhé kontextové informace

## Problémy s databází

### Chyby při práci s databází

**Problém**: Aplikace hlásí chyby při práci s SQLite databází.

**Řešení**:

1. Ověřte oprávnění k souboru databáze:

```bash
ls -la backend/database.sqlite
```

2. Zkontrolujte, zda adresář pro databázi existuje a máte k němu přístup
3. Zkuste vytvořit zálohu databáze a poté obnovit výchozí:

```bash
cp backend/database.sqlite backend/database.sqlite.bak
rm backend/database.sqlite
```

4. Restartujte backend službu, která automaticky vytvoří novou databázi:

```bash
docker-compose restart backend
```

### Ztráta dat nebo poškozená databáze

**Problém**: Databáze je poškozená nebo došlo ke ztrátě dat.

**Řešení**:

1. Pokud máte zálohu, obnovte ji:

```bash
cp backend/database.sqlite.bak backend/database.sqlite
```

2. Pokud nemáte zálohu, můžete zkusit opravit databázi pomocí nástroje `sqlite3`:

```bash
sqlite3 backend/database.sqlite "PRAGMA integrity_check"
```

3. V případě vážného poškození bude potřeba vytvořit novou databázi a znovu importovat data
4. Pro prevenci zálohujte databázi pravidelně:

```bash
# Přidejte do crontab
0 2 * * * cp /path/to/app/backend/database.sqlite /path/to/backups/database-$(date +\%Y\%m\%d).sqlite
```

## Problémy s rozhraním

### Webové rozhraní se nenačítá

**Problém**: Uživatelské rozhraní se nenačítá nebo zobrazuje chyby.

**Řešení**:

1. Zkontrolujte, zda backend služba běží:

```bash
curl http://localhost:3000/api/health
```

2. Vyčistěte cache prohlížeče a cookies
3. Zkontrolujte JavaScript konzoli v prohlížeči pro detailnější chybové zprávy
4. Ověřte, že všechny potřebné soubory jsou dostupné:

```bash
docker exec -it candy-backend ls -la /app/public
```

5. Restartujte backend službu:

```bash
docker-compose restart backend
```

### Problémy se socketovým připojením

**Problém**: Real-time funkce jako streamování odpovědí nefungují.

**Řešení**:

1. Zkontrolujte, zda je Socket.IO správně inicializováno na straně klienta
2. Ověřte, že prohlížeč podporuje WebSockets
3. Zkontrolujte, zda firewall neblokuje WebSocket připojení
4. Zkontrolujte logy pro chyby související se Socket.IO:

```bash
docker-compose logs backend | grep "socket"
```

5. Ujistěte se, že CORS nastavení v backend je správně nakonfigurováno

## Problémy s generováním obrázků

### Generování obrázků selhává

**Problém**: Funkce generování obrázků vrací chyby nebo negeneruje očekávané výsledky.

**Řešení**:

1. Zkontrolujte, zda ComfyUI kontejner běží:

```bash
docker-compose ps comfyui
```

2. Ověřte, že ComfyUI API je dostupné:

```bash
curl http://localhost:7860/sdapi/v1/sd-models
```

3. Zkontrolujte, zda jsou modely správně načteny:

```bash
docker exec -it candy-comfyui ls -la /models
```

4. Restartujte ComfyUI kontejner:

```bash
docker-compose restart comfyui
```

5. Zkontrolujte logy pro detailnější informace o chybě:

```bash
docker-compose logs comfyui
```

### Nekvalitní nebo neočekávané obrázky

**Problém**: Generované obrázky jsou nekvalitní nebo neodpovídají zadání.

**Řešení**:

1. Upravte prompt pro lepší popis požadovaného obrázku
2. Zvyšte počet kroků (`steps` parametr, doporučeno 30-50)
3. Experimentujte s hodnotou CFG scale (7-12 pro vyšší přesnost promptu)
4. Zkuste použít negativní prompt pro vyloučení nežádoucích prvků
5. Pokud máte k dispozici více modelů, vyzkoušejte jiný model pro generování

## Problémy s hlasovou službou

### Text-to-Speech nefunguje

**Problém**: Hlasový výstup není generován nebo dochází k chybám.

**Řešení**:

1. Zkontrolujte, zda TTS kontejner běží:

```bash
docker-compose ps coqui-tts
```

2. Ověřte, že TTS API je dostupné:

```bash
curl http://localhost:5002/api/version
```

3. Zkontrolujte, zda jsou hlasové modely správně načteny:

```bash
docker exec -it candy-tts ls -la /app/models
```

4. Restartujte TTS kontejner:

```bash
docker-compose restart coqui-tts
```

5. Ověřte, že formát požadavku na TTS API je správný a omezení délky textu jsou dodržována

## Problémy s výkonem

### Vysoké využití zdrojů

**Problém**: Aplikace spotřebovává nadměrné množství systémových zdrojů.

**Řešení**:

1. Monitorujte využití zdrojů kontejnery:

```bash
docker stats
```

2. Omezte množství paměti přidělené jednotlivým kontejnerům v docker-compose.yml:

```yaml
services:
  ollama:
    mem_limit: 4g
  comfyui:
    mem_limit: 4g
```

3. Používejte menší a efektivnější modely
4. Implementujte cache pro často používané dotazy a odpovědi
5. Zvažte škálování pomocí více instancí nebo výkonnějšího hardware

### Aplikace se postupně zpomaluje

**Problém**: Výkon aplikace se postupně zhoršuje během delšího provozu.

**Řešení**:

1. Zkontrolujte velikost log souborů a databáze:

```bash
docker exec -it candy-backend du -sh /app/database.sqlite
docker exec -it candy-backend du -sh /app/logs
```

2. Implementujte rotaci logů a údržbu databáze
3. Pravidelně restartujte služby, například pomocí cronu:

```bash
# Přidejte do crontab
0 4 * * * docker-compose restart
```

4. Zkontrolujte memory leaky v aplikaci pomocí nástrojů jako node-memwatch
5. Ověřte, že se databázové indexy používají efektivně

## Kontaktní podpora

Pokud problém přetrvává i po vyzkoušení výše uvedených řešení, kontaktujte podporu:

- E-mail: support@your-app.com
- Discord: https://discord.gg/your-app-community
- GitHub Issues: https://github.com/your-repo/issues

Při kontaktování podpory uveďte:

1. Podrobný popis problému
2. Kroky k reprodukování problému
3. Verzi aplikace a prostředí
4. Relevantní logy a chybové zprávy
5. Snímky obrazovky, pokud je to relevantní