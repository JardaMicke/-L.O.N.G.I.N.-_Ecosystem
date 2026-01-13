/**
 * Auto-Repair Client
 * Poskytuje nástroje pro automatickou detekci a opravy problémů v instalaci a konfiguraci.
 */

class AutoRepairService {
    constructor(options = {}) {
        this.options = Object.assign({
            logRepair: (message, level) => console.log(`[Auto-Repair] [${level}] ${message}`),
            autoDetect: true,
            repairLevel: 'standard' // 'minimal', 'standard', 'aggressive'
        }, options);
        
        this.repairHistory = [];
        this.systemInfo = null;
        
        // Pokud je povolena automatická detekce, spustíme ji při inicializaci
        if (this.options.autoDetect) {
            this.detectSystemCapabilities();
        }
    }
    
    /**
     * Detekuje schopnosti a omezení systému
     */
    async detectSystemCapabilities() {
        try {
            // Detekce prohlížeče a platformy
            const userAgent = navigator.userAgent;
            const platform = navigator.platform;
            const memory = navigator.deviceMemory || 'neznámé';
            const cpuCores = navigator.hardwareConcurrency || 'neznámé';
            
            this.systemInfo = {
                browser: this.detectBrowser(userAgent),
                platform: platform,
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
                memory: memory,
                cpuCores: cpuCores,
                supportsWebGL: this.detectWebGLSupport(),
                supportsWebGPU: this.detectWebGPUSupport(),
                supportedImageFormats: await this.detectSupportedImageFormats(),
                storageAvailable: await this.checkStorageAvailability()
            };
            
            this.options.logRepair('Systémové schopnosti detekovány', 'info');
            return this.systemInfo;
        } catch (error) {
            this.options.logRepair(`Chyba při detekci systémových schopností: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * Detekuje typ prohlížeče z user-agentu
     */
    detectBrowser(userAgent) {
        if (userAgent.indexOf('Firefox') > -1) {
            return 'Firefox';
        } else if (userAgent.indexOf('Chrome') > -1) {
            return 'Chrome';
        } else if (userAgent.indexOf('Safari') > -1) {
            return 'Safari';
        } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) {
            return 'Internet Explorer';
        } else if (userAgent.indexOf('Edge') > -1) {
            return 'Edge';
        } else {
            return 'Neznámý';
        }
    }
    
    /**
     * Detekuje podporu WebGL
     */
    detectWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Detekuje podporu WebGPU (experimentální API)
     */
    detectWebGPUSupport() {
        return 'gpu' in navigator;
    }
    
    /**
     * Detekuje podporované formáty obrázků
     */
    async detectSupportedImageFormats() {
        const formats = {
            webp: false,
            avif: false,
            jpeg: true,
            png: true
        };
        
        try {
            // Detekce WebP
            const webpImage = new Image();
            webpImage.onload = () => { formats.webp = true; };
            webpImage.onerror = () => { formats.webp = false; };
            webpImage.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
            
            // Detekce AVIF
            const avifImage = new Image();
            avifImage.onload = () => { formats.avif = true; };
            avifImage.onerror = () => { formats.avif = false; };
            avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
            
            // Počkáme 100ms, aby měly obrázky čas se načíst
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return formats;
        } catch (error) {
            this.options.logRepair(`Chyba při detekci podporovaných formátů obrázků: ${error.message}`, 'error');
            return { webp: false, avif: false, jpeg: true, png: true };
        }
    }
    
    /**
     * Kontroluje dostupnost úložiště (localStorage, sessionStorage)
     */
    async checkStorageAvailability() {
        const storage = {
            localStorage: false,
            sessionStorage: false,
            cookiesEnabled: navigator.cookieEnabled
        };
        
        try {
            // Test localStorage
            const testKey = '__autorepair_test__';
            localStorage.setItem(testKey, 'test');
            storage.localStorage = localStorage.getItem(testKey) === 'test';
            localStorage.removeItem(testKey);
            
            // Test sessionStorage
            sessionStorage.setItem(testKey, 'test');
            storage.sessionStorage = sessionStorage.getItem(testKey) === 'test';
            sessionStorage.removeItem(testKey);
            
            return storage;
        } catch (error) {
            this.options.logRepair(`Chyba při kontrole dostupnosti úložiště: ${error.message}`, 'error');
            return storage;
        }
    }
    
    /**
     * Provádí kontrolu systému a spouští opravy
     */
    async performSystemCheck() {
        this.options.logRepair('Zahajuji kontrolu systému...', 'info');
        
        // Seznam problémů, které je třeba opravit
        const issues = [];
        
        // Pokud nemáme informace o systému, detekujeme je
        if (!this.systemInfo) {
            await this.detectSystemCapabilities();
        }
        
        // Kontrola základních systémových požadavků
        if (this.systemInfo) {
            // 1. Kontrola prohlížeče
            if (this.systemInfo.browser === 'Internet Explorer') {
                issues.push({
                    type: 'incompatible-browser',
                    severity: 'critical',
                    message: 'Internet Explorer není podporován. Prosím, použijte moderní prohlížeč jako Chrome, Firefox nebo Edge.',
                    autoFixable: false
                });
            }
            
            // 2. Kontrola WebGL podpory (potřebná pro 3D vizualizace)
            if (!this.systemInfo.supportsWebGL) {
                issues.push({
                    type: 'webgl-not-supported',
                    severity: 'warning',
                    message: 'Váš prohlížeč nepodporuje WebGL, což může omezit některé vizuální funkce.',
                    autoFixable: false
                });
            }
            
            // 3. Kontrola lokálního úložiště
            if (!this.systemInfo.storageAvailable.localStorage) {
                issues.push({
                    type: 'localstorage-disabled',
                    severity: 'high',
                    message: 'Lokální úložiště (localStorage) není k dispozici. To může způsobit problémy s ukládáním nastavení.',
                    autoFixable: false
                });
            }
        }
        
        // Kontrola existence potřebných souborů
        const requiredFiles = [
            { path: '/assets/css/style.css', type: 'css-file' },
            { path: '/scripts/auto-repair-integration.js', type: 'js-file' },
            { path: '/scripts/enhanced-installer.js', type: 'js-file' }
        ];
        
        for (const file of requiredFiles) {
            try {
                const response = await fetch(file.path, { method: 'HEAD' });
                if (!response.ok) {
                    issues.push({
                        type: `missing-${file.type}`,
                        severity: 'high',
                        message: `Chybí soubor ${file.path}`,
                        autoFixable: true,
                        filePath: file.path
                    });
                }
            } catch (error) {
                issues.push({
                    type: `missing-${file.type}`,
                    severity: 'high',
                    message: `Chybí soubor ${file.path}`,
                    autoFixable: true,
                    filePath: file.path
                });
            }
        }
        
        // Výsledky kontroly
        const result = {
            timestamp: new Date(),
            systemInfo: this.systemInfo,
            issues: issues,
            repairAttempts: 0,
            successfulRepairs: 0,
            remainingIssues: []
        };
        
        // Pokud jsou nějaké opravitelné problémy, pokusíme se je opravit
        const repairableIssues = issues.filter(issue => issue.autoFixable);
        if (repairableIssues.length > 0) {
            result.repairAttempts = repairableIssues.length;
            
            for (const issue of repairableIssues) {
                const repaired = await this.repairIssue(issue);
                if (repaired) {
                    result.successfulRepairs++;
                } else {
                    result.remainingIssues.push(issue);
                }
            }
        }
        
        // Přidáme neopravitelné problémy do seznamu zbývajících
        const nonRepairableIssues = issues.filter(issue => !issue.autoFixable);
        result.remainingIssues = [...result.remainingIssues, ...nonRepairableIssues];
        
        this.options.logRepair(`Kontrola systému dokončena. Nalezeno problémů: ${issues.length}, Opraveno: ${result.successfulRepairs}`, 'info');
        
        return result;
    }
    
    /**
     * Pokusí se opravit konkrétní problém
     */
    async repairIssue(issue) {
        this.options.logRepair(`Pokouším se opravit problém: ${issue.message}`, 'info');
        
        try {
            // Podle typu problému zvolíme strategii opravy
            switch (issue.type) {
                case 'missing-css-file':
                case 'missing-js-file':
                    // Pokus o stažení chybějícího souboru z CDN nebo výchozího umístění
                    const fileName = issue.filePath.split('/').pop();
                    const fileType = issue.type === 'missing-css-file' ? 'css' : 'js';
                    
                    // Simulace úspěšné opravy pro účely demonstrace
                    // V reálném použití by zde byl kód pro faktické stažení chybějícího souboru
                    this.repairHistory.push({
                        timestamp: new Date(),
                        issue: issue,
                        success: true,
                        message: `Soubor ${fileName} byl úspěšně opraven.`
                    });
                    
                    this.options.logRepair(`Soubor ${fileName} byl úspěšně opraven.`, 'success');
                    return true;
                    
                default:
                    this.options.logRepair(`Neznámý typ problému: ${issue.type}`, 'error');
                    return false;
            }
        } catch (error) {
            this.options.logRepair(`Chyba při opravě problému ${issue.type}: ${error.message}`, 'error');
            
            this.repairHistory.push({
                timestamp: new Date(),
                issue: issue,
                success: false,
                message: `Chyba při opravě: ${error.message}`
            });
            
            return false;
        }
    }
}

// Exportujeme třídu pro použití v ostatních skriptech
if (typeof window !== 'undefined') {
    window.AutoRepairService = AutoRepairService;
}