// Globální proměnné
let connectionStatus = false;
let clientInfo = null;

// DOM elementy
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const connectionForm = document.getElementById('connectionForm');
const connectedView = document.getElementById('connectedView');
const clientNameInput = document.getElementById('clientName');
const pinCodeInput = document.getElementById('pinCode');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const clientNameDisplay = document.getElementById('clientNameDisplay');
const clientIdDisplay = document.getElementById('clientIdDisplay');
const clientStatusDisplay = document.getElementById('clientStatusDisplay');

// Inicializace popup
document.addEventListener('DOMContentLoaded', async () => {
    // Načtení uložených dat
    const savedData = await chrome.storage.local.get(['clientName', 'connectionStatus', 'clientInfo']);
    
    // Nastavení jména klienta, pokud existuje
    if (savedData.clientName) {
        clientNameInput.value = savedData.clientName;
    }
    
    // Kontrola stavu připojení
    if (savedData.connectionStatus) {
        connectionStatus = savedData.connectionStatus;
        clientInfo = savedData.clientInfo;
        updateConnectionUI();
    }
    
    // Kontrola stavu připojení k lokální aplikaci
    checkLocalAppConnection();
});

// Kontrola připojení k lokální aplikaci
async function checkLocalAppConnection() {
    try {
        const response = await fetch('http://localhost:5001/api/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Lokální aplikace běží
            statusIndicator.classList.add('connected');
            statusText.textContent = connectionStatus ? 'Připojeno' : 'Lokální aplikace je dostupná';
        } else {
            // Lokální aplikace není dostupná
            statusIndicator.classList.remove('connected');
            statusText.textContent = 'Lokální aplikace není dostupná';
            setConnectionStatus(false);
        }
    } catch (error) {
        // Lokální aplikace není dostupná
        statusIndicator.classList.remove('connected');
        statusText.textContent = 'Lokální aplikace není dostupná';
        setConnectionStatus(false);
    }
}

// Aktualizace UI podle stavu připojení
function updateConnectionUI() {
    if (connectionStatus && clientInfo) {
        // Zobrazení informací o připojení
        connectionForm.style.display = 'none';
        connectedView.style.display = 'flex';
        clientNameDisplay.textContent = clientInfo.name;
        clientIdDisplay.textContent = clientInfo.id;
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Připojeno';
    } else {
        // Zobrazení formuláře pro připojení
        connectionForm.style.display = 'flex';
        connectedView.style.display = 'none';
        statusIndicator.classList.remove('connected');
        checkLocalAppConnection(); // Znovu zkontrolovat stav lokální aplikace
    }
}

// Nastavení stavu připojení
async function setConnectionStatus(status, info = null) {
    connectionStatus = status;
    clientInfo = info;
    
    // Uložení stavu do lokálního úložiště
    await chrome.storage.local.set({
        connectionStatus: status,
        clientInfo: info
    });
    
    // Aktualizace UI
    updateConnectionUI();
    
    // Informování background skriptu o změně stavu
    chrome.runtime.sendMessage({
        action: status ? 'connect' : 'disconnect',
        clientInfo: info
    });
}

// Event listener pro tlačítko připojení
connectBtn.addEventListener('click', async () => {
    const clientName = clientNameInput.value.trim();
    const pinCode = pinCodeInput.value.trim();
    
    // Validace vstupů
    if (!clientName) {
        alert('Zadejte název počítače');
        return;
    }
    
    if (!pinCode || pinCode.length !== 4) {
        alert('Zadejte platný 4-místný PIN kód');
        return;
    }
    
    // Uložení jména klienta
    await chrome.storage.local.set({ clientName });
    
    try {
        // Připojení k lokální aplikaci
        const response = await fetch('http://localhost:5001/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: clientName,
                pinCode: pinCode
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            setConnectionStatus(true, {
                id: data.client_id,
                name: clientName
            });
        } else {
            const error = await response.json();
            alert(`Chyba připojení: ${error.message || 'Neznámá chyba'}`);
        }
    } catch (error) {
        alert('Nelze se připojit k lokální aplikaci. Ujistěte se, že je spuštěna.');
    }
});

// Event listener pro tlačítko odpojení
disconnectBtn.addEventListener('click', async () => {
    try {
        // Odpojení od lokální aplikace
        if (clientInfo) {
            await fetch(`http://localhost:5001/api/disconnect/${clientInfo.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Chyba při odpojování:', error);
    } finally {
        // Vždy nastavit stav na odpojeno
        setConnectionStatus(false);
    }
});

// Poslouchání zpráv od background skriptu
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'connectionStatusChanged') {
        connectionStatus = message.status;
        clientInfo = message.clientInfo;
        updateConnectionUI();
    } else if (message.action === 'checkConnection') {
        checkLocalAppConnection();
    }
    
    sendResponse({ received: true });
    return true;
});