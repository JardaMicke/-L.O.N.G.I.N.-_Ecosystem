# Návod na nasazení aplikace (Deployment Tutorial)

Tento dokument slouží jako krok-za-krokem průvodce pro nasazení aplikace **Longin Hosting** do produkčního prostředí.

## 📋 Požadavky

Před začátkem se ujistěte, že máte k dispozici:

1.  **Linux VPS** (doporučeno Ubuntu 20.04 nebo novější).
    *   Minimálně **4GB RAM** (kvůli ELK stacku a monitoringu).
    *   2 CPU jádra doporučeno.
2.  **Veřejnou IP adresu** a **Doménu** (např. `muj-hosting.cz`).
    *   Nastavte DNS záznamy (A záznam) pro vaši doménu na IP adresu serveru.
    *   Doporučujeme nastavit i wildcard subdoménu `*.muj-hosting.cz` pro dynamicky vytvářené aplikace, nebo alespoň subdomény `api`, `monitor`, `logs`.
3.  **Nainstalovaný software:**
    *   [Docker Engine](https://docs.docker.com/engine/install/) (verze 24+)
    *   [Docker Compose](https://docs.docker.com/compose/install/) (verze 2+)
    *   [Git](https://git-scm.com/downloads)

## 🚀 Postup instalace

### 1. Stažení zdrojového kódu

Připojte se na svůj server přes SSH a naklonujte repozitář:

```bash
cd /opt
git clone https://github.com/your-org/longin-hosting.git
cd longin-hosting
```

### 2. Konfigurace prostředí

Aplikace vyžaduje nastavení citlivých údajů přes proměnné prostředí. Vytvořte soubor `.env` (nebo použijte existující `.env.production` jako šablonu):

```bash
cp .env.example .env
nano .env
```

**Důležité proměnné k nastavení:**

*   **Databáze:**
    *   `POSTGRES_USER`: Uživatelské jméno pro DB.
    *   `POSTGRES_PASSWORD`: Silné heslo pro DB.
    *   `POSTGRES_DB`: Název databáze (např. `longin_db`).
*   **Redis:**
    *   `REDIS_PASSWORD`: Heslo pro Redis.
*   **Zabezpečení (JWT):**
    *   `JWT_ACCESS_SECRET`: Dlouhý náhodný řetězec (např. vygenerovaný pomocí `openssl rand -hex 32`).
    *   `JWT_REFRESH_SECRET`: Jiný dlouhý náhodný řetězec.
*   **Doména:**
    *   `DOMAIN`: Vaše hlavní doména (např. `muj-hosting.cz`).
    *   `ACME_EMAIL`: Email pro Let's Encrypt certifikáty.

### 3. Příprava adresářů

Docker si vytvoří volumes automaticky, ale pro přehlednost je dobré ověřit práva, pokud používáte bind mounts (což je v defaultní konfiguraci pro některé služby nastaveno).

### 4. Spuštění aplikace

Použijte produkční konfiguraci `docker-compose.prod.yml` pro spuštění všech služeb:

```bash
# 1. Sestavení obrazů (pokud nepoužíváte předpřipravené z registry)
docker compose -f docker-compose.prod.yml build

# 2. Spuštění kontejnerů na pozadí
docker compose -f docker-compose.prod.yml up -d
```

### 5. Ověření stavu

Počkejte několik minut, než naběhnou všechny služby (zejména Elasticsearch a Kibana mohou startovat déle). Stav ověříte příkazem:

```bash
docker compose -f docker-compose.prod.yml ps
```

Všechny kontejnery by měly mít stav `Up`.

## 🌐 Přístup k aplikaci

Po úspěšném nasazení budou dostupné následující služby na vaší doméně (za předpokladu správného nastavení DNS):

*   **Hlavní aplikace (UI):** `https://vas-domena.cz`
*   **API:** `https://api.vas-domena.cz`
*   **Monitoring (Grafana):** `https://monitor.vas-domena.cz`
    *   Výchozí přihlášení: `admin` / `admin` (změňte ihned po prvním přihlášení!)
*   **Logy (Kibana):** `https://logs.vas-domena.cz`

## 🔄 Aktualizace a Údržba

### Jak aktualizovat aplikaci?

Pro stažení nejnovější verze kódu a přebudování kontejnerů:

```bash
cd /opt/longin-hosting
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Zálohování

Pravidelně zálohujte Docker volumes, zejména:
*   `postgres_data` (uživatelé, nastavení aplikací)
*   `grafana_data` (dashboardy)

### Řešení problémů

Pokud aplikace nenabíhá, zkontrolujte logy kontejnerů:

```bash
# Logy backendu
docker compose -f docker-compose.prod.yml logs -f longin-core

# Logy Traefik (proxy)
docker compose -f docker-compose.prod.yml logs -f traefik
```
