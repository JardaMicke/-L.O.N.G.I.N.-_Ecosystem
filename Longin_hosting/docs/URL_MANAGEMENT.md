# Správa URL adresy aplikace

Tato funkce umožňuje uživatelům definovat veřejnou URL adresu, pod kterou bude jejich aplikace dostupná.

## Funkcionalita

1. **Nastavení URL:**
   * V detailu aplikace (záložka **Settings**) může uživatel zadat URL adresu.
   * Podporuje formát `http://` a `https://`.

2. **Validace:**
   * **Formát:** Kontroluje se syntaktická správnost URL.
   * **Unikátnost:** Systém ověřuje, zda URL není již používána jinou aplikací v rámci platformy.
   * **Dostupnost:** Systém se pokusí kontaktovat URL (HEAD request) a informuje uživatele, zda je adresa již dostupná (status code 200).
     * *Poznámka:* Nedostupnost nebrání uložení (uživatel může DNS teprve nastavovat).

3. **Uložení:**
   * Po úspěšné validaci se URL uloží do databáze k dané aplikaci.

## Použití

1. Přejděte na **Dashboard** -> **Applications**.
2. Vyberte aplikaci.
3. Klikněte na záložku **Settings**.
4. V sekci **Public URL Configuration** zadejte požadovanou adresu.
5. Klikněte na **Check Availability** pro ověření.
6. Pokud je vše v pořádku, klikněte na **Save Configuration**.

## Technické detaily

* **Backend:** `ApplicationService.validateUrl` provádí kontroly. Endpoint `POST /applications/validate-url` a `PATCH /applications/:id`.
* **Frontend:** Komponenta `UrlConfiguration` v `ApplicationDetail.tsx`.
