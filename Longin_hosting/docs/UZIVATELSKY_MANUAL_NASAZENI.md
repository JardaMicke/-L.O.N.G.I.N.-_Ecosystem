# Uživatelský manuál: Nasazení aplikace na Longin Hosting

Vítejte v oficiálním průvodci pro nasazení vaší aplikace na platformu **Longin Hosting**. Tento tutoriál vás provede celým procesem od přípravy aplikace až po její spuštění a údržbu.

## 1. Příprava

Než začnete, ujistěte se, že máte připravené následující:

### Technické požadavky
*   **Zdrojový kód aplikace** (Node.js, Python, Go, PHP, atd.)
*   **Docker** nainstalovaný na vašem lokálním počítači (pro sestavení obrazu).
*   Účet na **Docker Hub** (nebo jiném container registry) pro uložení obrazu aplikace.
*   Přístupové údaje k **Longin Hosting Dashboardu**.

### Vytvoření aplikace v Longin
1.  Přihlaste se do Longin Dashboardu.
2.  Klikněte na tlačítko **"Create Application"**.
3.  Zadejte název aplikace (např. `my-awesome-app`).
4.  Systém vaší aplikaci přidělí unikátní **Port** (např. `3105`). **Tento port si zapamatujte**, budete ho potřebovat v dalším kroku.

---

## 2. Příprava aplikace

Aby vaše aplikace na Longin Hostingu fungovala správně, musí být "container-ready".

### 2.1 Konfigurace portu (Kritické!)
Longin Hosting používá dynamické přidělování portů. Vaše aplikace **nesmí** poslouchat na fixním portu (např. 80 nebo 3000), ale musí respektovat port přidělený prostředím.

**Příklad pro Node.js (Express):**
```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

**Příklad pro Python (Flask):**
```python
import os
port = int(os.environ.get("PORT", 5000))
app.run(host='0.0.0.0', port=port)
```

### 2.2 Vytvoření Dockerfile
V kořenovém adresáři aplikace vytvořte soubor `Dockerfile`.

**Ukázkový Dockerfile (Node.js):**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Nepoužívejte EXPOSE s fixním číslem, pokud to není nutné, 
# ale pro dokumentaci je dobré uvést, co aplikace očekává.
# Longin ale vyžaduje, aby aplikace běžela na přiděleném portu.

CMD ["node", "server.js"]
```

---

## 3. Nahrání aplikace (Upload)

Longin Hosting nepoužívá FTP. Aplikace se nahrávají jako **Docker Image**. Máte dvě možnosti:

### Možnost A: Ruční nahrání (Pro začátečníky)

1.  **Sestavení obrazu:**
    Otevřete terminál ve složce s aplikací a spusťte:
    ```bash
    docker build -t vase-jmeno/nazev-aplikace:v1 .
    ```

2.  **Nahrání na Docker Hub:**
    ```bash
    docker login
    docker push vase-jmeno/nazev-aplikace:v1
    ```

3.  **Nasazení v Longin:**
    *   Jděte do detailu aplikace v Longin Dashboardu.
    *   V sekci **Deployment** zadejte název obrazu: `vase-jmeno/nazev-aplikace:v1`.
    *   Klikněte na **Deploy**.

### Možnost B: Git Webhook (CI/CD)

Pro automatické nasazení při každém `git push`:
1.  Nastavte si GitHub Action, která sestaví Docker image a pushne ho na Docker Hub.
2.  V Longin Dashboardu v sekci **Settings** zkopírujte **Webhook URL**.
3.  Přidejte tento Webhook do vaší GitHub Action jako poslední krok (zavolání URL pomocí `curl`).

---

## 4. Konfigurace

Po prvním nasazení je nutné aplikaci nakonfigurovat.

### 4.1 Environment Variables (Proměnné prostředí)
V detailu aplikace přejděte na záložku **Settings** (nebo Configuration).

1.  **Nastavení Portu (Povinné):**
    *   Přidejte proměnnou `PORT`.
    *   Hodnota musí být shodná s portem, který systém aplikaci přidělil (viditelné v hlavičce detailu aplikace, např. `3105`).
    *   *Bez tohoto kroku se aplikace nespustí správně, protože nebude vědět, na jakém portu má naslouchat.*

2.  **Další proměnné:**
    *   Přidejte připojení k databázi (`DB_URL`), API klíče, atd.

### 4.2 Veřejná URL
Pokud chcete, aby byla aplikace dostupná na veřejné doméně (např. `https://my-app.longin.cz`):
1.  V záložce **Settings** najděte sekci **Public URL**.
2.  Zadejte požadovanou subdoménu.
3.  Klikněte na **Check Availability** a poté **Save**.

---

## 5. Testování

Jakmile kliknete na **Deploy**, sledujte průběh:

1.  **Status:** Měl by se změnit z `Pending` na `Running`.
2.  **Logy:** Přejděte na záložku **Logs**. Zde uvidíte výstup z konzole vaší aplikace.
    *   Hledejte zprávu typu "Server running on port 3105".
    *   Pokud vidíte chyby (např. `EADDRINUSE` nebo pád aplikace), zkontrolujte Environment Variables.
3.  **Ověření funkčnosti:** Klikněte na odkaz aplikace (Public URL) nebo otevřete IP adresu serveru s portem (pokud jste na VPN/intranetu).

### Řešení běžných problémů
*   **Aplikace běží, ale stránka se nenačte:** Zkontrolujte, zda jste nastavili proměnnou `PORT` na hodnotu přidělenou Longinem.
*   **Chyba "CrashLoopBackOff" (neustálé restarty):** Zkontrolujte Logs. Často jde o chybějící environment variables nebo chybu v kódu.

---

## 6. Údržba

*   **Aktualizace:** Pro nasazení nové verze stačí nahrát nový Docker image (např. s tagem `v2`) a v Longin Dashboardu aktualizovat konfiguraci a kliknout na **Deploy**.
*   **Monitoring:** V záložce **Metrics** můžete sledovat využití CPU a RAM v reálném čase. Pokud aplikace spotřebovává příliš mnoho paměti, zvažte optimalizaci kódu.
*   **Zálohování:** Longin Hosting nezálohuje data *uvnitř* kontejneru. Vždy používejte externí databázi nebo připojené Volume (pokud je povoleno) pro ukládání trvalých dat. Data v kontejneru jsou při redeployi ztracena.

---

*Tip pro optimalizaci:* Používejte `alpine` verze Docker images (např. `node:18-alpine`) pro rychlejší stahování a startování aplikace.
