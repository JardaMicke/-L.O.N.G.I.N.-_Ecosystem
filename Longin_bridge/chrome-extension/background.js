// Globální proměnné
let connectionStatus = false;
let clientInfo = null;
let webrtcConnections = {};
let peerConnection = null;
let dataChannel = null;

// Inicializace při spuštění rozšíření
chrome.runtime.onInstalled.addListener(async () => {
    console.log('LAN-over-Internet Connector nainstalován');
    
    // Načtení uložených dat
    const savedData = await chrome.storage.local.get(['connectionStatus', 'clientInfo']);
    connectionStatus = savedData.connectionStatus || false;
    clientInfo = savedData.clientInfo || null;
    
    // Nastavení ikony podle stavu připojení
    updateIcon();
    
    // Pokud je připojení aktivní, vytvoření WebRTC připojení
    if (connectionStatus && clientInfo) {
        createWebRTCConnection();
    }
});

// Aktualizace ikony podle stavu připojení
function updateIcon() {
    const iconPath = connectionStatus ? 'icons/icon16-connected.png' : 'icons/icon16.png';
    chrome.action.setIcon({ path: iconPath });
}

// Poslouchání zpráv od popup nebo content skriptů
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Přijata zpráva:', message);
    
    // Zpracování zprávy podle akce
    switch (message.action) {
        case 'connect':
            // Připojení k lokální aplikaci
            connectToLocalApp(message.clientName, message.pinCode)
                .then(response => {
                    // Aktualizace stavu připojení
                    connectionStatus = true;
                    clientInfo = response.clientInfo;
                    updateIcon();
                    
                    // Vytvoření WebRTC připojení k lokální aplikaci
                    createWebRTCConnection();
                    
                    // Informování všech aktivních content skriptů o připojení
                    broadcastToContentScripts({
                        action: 'connectionStatusChanged',
                        connected: true,
                        clientInfo: clientInfo
                    });
                    
                    sendResponse({ success: true, clientInfo: clientInfo });
                })
                .catch(error => {
                    console.error('Chyba při připojování k lokální aplikaci:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Asynchronní odpověď
            
        case 'disconnect':
            // Odpojení od lokální aplikace
            disconnectFromLocalApp()
                .then(() => {
                    // Aktualizace stavu připojení
                    connectionStatus = false;
                    clientInfo = null;
                    updateIcon();
                    
                    // Uzavření WebRTC připojení
                    closeWebRTCConnection();
                    
                    // Informování všech aktivních content skriptů o odpojení
                    broadcastToContentScripts({
                        action: 'connectionStatusChanged',
                        connected: false,
                        clientInfo: null
                    });
                    
                    // Uzavření všech WebRTC připojení
                    closeAllWebRTCConnections();
                    
                    sendResponse({ success: true });
                })
                .catch(error => {
                    console.error('Chyba při odpojování od lokální aplikace:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Asynchronní odpověď
            
        case 'getConnectionStatus':
            // Vrácení aktuálního stavu připojení
            sendResponse({
                connected: connectionStatus,
                clientInfo: clientInfo,
                webrtcConnected: dataChannel && dataChannel.readyState === 'open'
            });
            return false; // Synchronní odpověď
            
        case 'sendMessage':
            // Odeslání zprávy přes WebRTC
            if (dataChannel && dataChannel.readyState === 'open') {
                try {
                    dataChannel.send(JSON.stringify(message.message));
                    sendResponse({ success: true });
                } catch (error) {
                    console.error('Chyba při odesílání zprávy přes WebRTC:', error);
                    sendResponse({ success: false, error: error.message });
                }
            } else {
                sendResponse({ success: false, error: 'WebRTC datový kanál není připraven' });
            }
            return false; // Synchronní odpověď
            
        default:
            console.warn('Neznámá akce:', message.action);
            sendResponse({ success: false, error: 'Neznámá akce' });
            return false; // Synchronní odpověď
    }
});

// Odeslání zprávy všem aktivním content skriptům
async function broadcastToContentScripts(message) {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
        try {
            chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
            console.error(`Chyba při odesílání zprávy do tabu ${tab.id}:`, error);
        }
    }
}

// Připojení k lokální aplikaci
async function connectToLocalApp(clientName, pinCode) {
    try {
        // Odeslání požadavku na připojení do lokální aplikace
        const response = await fetch('http://localhost:5001/api/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_name: clientName,
                pin_code: pinCode
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Chyba při připojování k lokální aplikaci');
        }
        
        const data = await response.json();
        
        // Uložení informací o klientovi do lokálního úložiště
        await chrome.storage.local.set({
            connectionStatus: true,
            clientInfo: data.client
        });
        
        return { success: true, clientInfo: data.client };
    } catch (error) {
        console.error('Chyba při připojování k lokální aplikaci:', error);
        throw error;
    }
}

// Odpojení od lokální aplikace
async function disconnectFromLocalApp() {
    try {
        if (!connectionStatus || !clientInfo) {
            return { success: true };
        }
        
        // Odeslání požadavku na odpojení do lokální aplikace
        const response = await fetch('http://localhost:5001/api/disconnect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientInfo.id
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Chyba při odpojování od lokální aplikace');
        }
        
        // Vyčištění informací o klientovi v lokálním úložišti
        await chrome.storage.local.set({
            connectionStatus: false,
            clientInfo: null
        });
        
        return { success: true };
    } catch (error) {
        console.error('Chyba při odpojování od lokální aplikace:', error);
        throw error;
    }
}

// Vytvoření WebRTC připojení k lokální aplikaci
function createWebRTCConnection() {
    // Uzavření existujícího připojení, pokud existuje
    closeWebRTCConnection();
    
    // Konfigurace WebRTC s STUN servery
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    };
    
    // Vytvoření nového peer connection
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Vytvoření datového kanálu
    dataChannel = peerConnection.createDataChannel('network', {
        ordered: true,
        maxRetransmits: 3
    });
    
    // Nastavení event handlerů pro datový kanál
    setupDataChannel();
    
    // Nastavení event handlerů pro ICE kandidáty
    peerConnection.onicecandidate = handleIceCandidate;
    
    // Nastavení event handlerů pro změnu stavu připojení
    peerConnection.onconnectionstatechange = handleConnectionStateChange;
    
    // Vytvoření a odeslání nabídky
    createAndSendOffer();
}

// Nastavení event handlerů pro datový kanál
function setupDataChannel() {
    dataChannel.onopen = () => {
        console.log('WebRTC datový kanál otevřen');
        
        // Informování všech aktivních content skriptů o připojení
        broadcastToContentScripts({
            action: 'webrtcConnected'
        });
    };
    
    dataChannel.onclose = () => {
        console.log('WebRTC datový kanál uzavřen');
        
        // Informování všech aktivních content skriptů o odpojení
        broadcastToContentScripts({
            action: 'webrtcDisconnected'
        });
    };
    
    dataChannel.onmessage = (event) => {
        handleDataChannelMessage(event.data);
    };
    
    dataChannel.onerror = (error) => {
        console.error('Chyba WebRTC datového kanálu:', error);
    };
}

// Zpracování zpráv z datového kanálu
function handleDataChannelMessage(data) {
    try {
        const message = JSON.parse(data);
        console.log('Přijata zpráva přes WebRTC:', message);
        
        // Informování všech aktivních content skriptů o přijaté zprávě
        broadcastToContentScripts({
            action: 'messageReceived',
            message: message
        });
    } catch (error) {
        console.error('Chyba při zpracování zprávy z WebRTC:', error);
    }
}

// Vytvoření a odeslání WebRTC nabídky
async function createAndSendOffer() {
    try {
        // Vytvoření nabídky
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Odeslání nabídky do lokální aplikace
        const response = await fetch('http://localhost:5001/api/webrtc/offer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientInfo.id,
                offer: offer
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Chyba při odesílání WebRTC nabídky');
        }
        
        const data = await response.json();
        
        // Zpracování odpovědi
        if (data.answer) {
            await peerConnection.setRemoteDescription(data.answer);
        }
    } catch (error) {
        console.error('Chyba při vytváření a odesílání WebRTC nabídky:', error);
    }
}

// Zpracování ICE kandidátů
function handleIceCandidate(event) {
    if (event.candidate) {
        // Odeslání ICE kandidáta do lokální aplikace
        fetch('http://localhost:5001/api/webrtc/ice-candidate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientInfo.id,
                candidate: event.candidate
            })
        }).catch(error => {
            console.error('Chyba při odesílání ICE kandidáta:', error);
        });
    }
}

// Zpracování změn stavu připojení
function handleConnectionStateChange() {
    const state = peerConnection.connectionState;
    console.log(`WebRTC stav připojení: ${state}`);
    
    if (state === 'connected') {
        console.log('WebRTC připojení navázáno');
    } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.log('WebRTC připojení ukončeno');
    }
}

// Uzavření WebRTC připojení
function closeWebRTCConnection() {
    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
}

// Zpracování WebRTC ICE kandidáta
async function processIceCandidate(candidate) {
    try {
        if (!connectionStatus || !clientInfo) {
            return { success: false, error: 'Není aktivní připojení' };
        }
        
        // Odeslání ICE kandidáta do lokální aplikace
        const response = await fetch('http://localhost:5001/api/webrtc/ice-candidate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientInfo.id,
                candidate: candidate
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Chyba při zpracování WebRTC ICE kandidáta');
        }
        
        return { success: true };
    } catch (error) {
        console.error('Chyba při zpracování WebRTC ICE kandidáta:', error);
        throw error;
    }
}

// Uzavření všech WebRTC připojení
function closeAllWebRTCConnections() {
    // Uzavření hlavního WebRTC připojení
    closeWebRTCConnection();
    
    for (const targetId in webrtcConnections) {
        const connection = webrtcConnections[targetId];
        
        // Informování content skriptu o uzavření připojení
        try {
            chrome.tabs.sendMessage(connection.tabId, {
                action: 'closeWebRTCConnection',
                targetId: targetId
            });
        } catch (error) {
            console.error(`Chyba při odesílání zprávy o uzavření připojení do tabu ${connection.tabId}:`, error);
        }
    }
    
    // Vyčištění seznamu připojení
    webrtcConnections = {};
}

// Pravidelná kontrola připojení k lokální aplikaci
setInterval(async () => {
    try {
        const response = await fetch('http://localhost:5001/api/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok && connectionStatus) {
            // Lokální aplikace není dostupná, ale stav je připojeno
            connectionStatus = false;
            clientInfo = null;
            updateIcon();
            
            // Informování všech aktivních content skriptů o odpojení
            broadcastToContentScripts({
                action: 'connectionStatusChanged',
                status: false,
                clientInfo: null
            });
            
            // Uzavření všech WebRTC připojení
            closeAllWebRTCConnections();
            
            // Aktualizace lokálního úložiště
            await chrome.storage.local.set({
                connectionStatus: false,
                clientInfo: null
            });
        } else if (response.ok && connectionStatus) {
            // Kontrola stavu WebRTC připojení
            if (peerConnection && peerConnection.connectionState !== 'connected' && 
                peerConnection.connectionState !== 'connecting' && 
                peerConnection.connectionState !== 'new') {
                console.log('WebRTC připojení bylo přerušeno, pokus o obnovení...');
                
                // Pokus o obnovení WebRTC připojení
                createWebRTCConnection();
            }
        }
    } catch (error) {
        if (connectionStatus) {
            // Lokální aplikace není dostupná, ale stav je připojeno
            connectionStatus = false;
            clientInfo = null;
            updateIcon();
            
            // Informování všech aktivních content skriptů o odpojení
            broadcastToContentScripts({
                action: 'connectionStatusChanged',
                status: false,
                clientInfo: null
            });
            
            // Uzavření všech WebRTC připojení
            closeAllWebRTCConnections();
            
            // Aktualizace lokálního úložiště
            await chrome.storage.local.set({
                connectionStatus: false,
                clientInfo: null
            });
        }
    }
}, 5000); // Kontrola každých 5 sekund