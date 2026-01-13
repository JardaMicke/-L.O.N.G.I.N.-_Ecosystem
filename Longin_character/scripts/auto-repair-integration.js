/**
 * Auto-Repair Integration
 * Integruje systém automatické opravy do instalačního procesu.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kontrola, zda je k dispozici služba Auto-Repair
    if (window.AutoRepairService) {
        console.log('Auto-Repair Integration: Služba je dostupná, inicializuji...');
        
        // Inicializace auto-repair služby s vlastním logovacím systémem
        const autoRepair = new window.AutoRepairService({
            logRepair: (message, level) => {
                console.log(`[AUTO-REPAIR] [${level}] ${message}`);
                
                // Pokud existuje element pro výsledky testů, přidáme zprávu tam
                const resultsOutput = document.getElementById('test-results');
                if (resultsOutput) {
                    const status = level === 'error' ? 'FAIL' : level === 'success' ? 'OK' : 'INFO';
                    resultsOutput.value += `[${status}] ${message}\n`;
                    resultsOutput.scrollTop = resultsOutput.scrollHeight;
                }
                
                // Pokud existuje element pro výstup příkazů, přidáme zprávu tam pro závažnější úrovně
                if (level === 'error' || level === 'warning' || level === 'success') {
                    const commandOutput = document.getElementById('command-results');
                    if (commandOutput) {
                        const timestamp = new Date().toLocaleTimeString();
                        commandOutput.value += `[${timestamp}] Auto-repair: ${message}\n`;
                        commandOutput.scrollTop = commandOutput.scrollHeight;
                    }
                }
            },
            autoDetect: true,
            repairLevel: 'standard'
        });
        
        // Přidáme auto-repair do globálního kontextu pro přístup z jiných skriptů
        window._autoRepairInstance = autoRepair;
        
        // Přidáme listener pro automatickou opravu na tlačítko kontroly systému
        const checkSystemBtn = document.querySelector('button[onclick="runSystemChecks()"]');
        if (checkSystemBtn) {
            // Přidáme data atribut pro identifikaci
            checkSystemBtn.setAttribute('data-auto-repair', 'enabled');
            
            console.log('Auto-Repair Integration: Přidán listener na tlačítko kontroly systému');
        }
        
        // Automatická kontrola při načtení stránky s mírným zpožděním
        setTimeout(() => {
            autoRepair.performSystemCheck().then(result => {
                console.log('Auto-Repair Integration: Počáteční kontrola systému dokončena', result);
                
                // Zobrazíme výsledky v UI, pokud je k dispozici element pro výsledky
                const resultsOutput = document.getElementById('test-results');
                if (resultsOutput && result.issues.length > 0) {
                    resultsOutput.value += `[INFO] Automatická kontrola systému nalezla ${result.issues.length} problémů.\n`;
                    resultsOutput.value += `[INFO] ${result.successfulRepairs} problémů bylo automaticky opraveno.\n`;
                    
                    if (result.remainingIssues.length > 0) {
                        resultsOutput.value += `[WARN] Zbývá ${result.remainingIssues.length} nevyřešených problémů.\n`;
                    }
                    
                    resultsOutput.scrollTop = resultsOutput.scrollHeight;
                }
            }).catch(error => {
                console.error('Auto-Repair Integration: Chyba při počáteční kontrole systému', error);
            });
        }, 2000);
    } else {
        console.warn('Auto-Repair Integration: Služba není dostupná. Ujistěte se, že je načten soubor auto-repair-client.js');
    }
});

/**
 * Funkce pro aktualizaci konfigurace na základě detekovaných schopností systému
 */
function updateConfigBasedOnSystemCapabilities() {
    if (window._autoRepairInstance && window._autoRepairInstance.systemInfo) {
        const systemInfo = window._autoRepairInstance.systemInfo;
        
        // Aktualizace nastavení paměti na základě dostupné RAM
        const memorySlider = document.getElementById('max-memory-usage');
        if (memorySlider && typeof systemInfo.memory === 'number') {
            // Pokud máme méně než 8GB RAM, snížíme výchozí hodnotu
            if (systemInfo.memory < 8) {
                memorySlider.value = 60; // 60% max využití pro systémy s nízkou RAM
                document.getElementById('memory-usage-value').textContent = memorySlider.value;
            } else if (systemInfo.memory >= 16) {
                // Pro systémy s vysokou RAM můžeme zvýšit výchozí hodnotu
                memorySlider.value = 85; // 85% max využití pro systémy s vysokou RAM
                document.getElementById('memory-usage-value').textContent = memorySlider.value;
            }
        }
        
        // Aktualizace nastavení hardwarové akcelerace na základě podpory WebGL
        const hwAccelerationCheckbox = document.getElementById('enable-hw-acceleration');
        if (hwAccelerationCheckbox && systemInfo.supportsWebGL !== undefined) {
            hwAccelerationCheckbox.checked = systemInfo.supportsWebGL;
        }
        
        // Automaticky upravíme formát obrázků podle podpory prohlížeče
        if (systemInfo.supportedImageFormats) {
            const imageFormatSelect = document.getElementById('preferred-image-format');
            if (imageFormatSelect) {
                if (systemInfo.supportedImageFormats.avif) {
                    imageFormatSelect.value = 'avif'; // AVIF má nejlepší kompresi
                } else if (systemInfo.supportedImageFormats.webp) {
                    imageFormatSelect.value = 'webp'; // WebP je dobrý kompromis
                } else {
                    imageFormatSelect.value = 'jpg'; // JPEG jako záloha
                }
            }
        }
        
        // Určíme optimální počet vláken pro zpracování na základě počtu CPU jader
        const threadsInput = document.getElementById('processing-threads');
        if (threadsInput && typeof systemInfo.cpuCores === 'number') {
            // Nastavíme počet vláken na 75% dostupných CPU jader, minimálně 2, maximálně 16
            const recommendedThreads = Math.max(2, Math.min(16, Math.floor(systemInfo.cpuCores * 0.75)));
            threadsInput.value = recommendedThreads;
        }
        
        console.log('Auto-Repair Integration: Konfigurace aktualizována na základě systémových schopností');
    }
}

// Exportujeme funkce, které budou používány v jiných skriptech
window.autoRepairIntegration = {
    updateConfigBasedOnSystemCapabilities
};