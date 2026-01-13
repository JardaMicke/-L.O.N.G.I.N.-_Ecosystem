/**
 * LAN-over-Internet Content Script
 * 
 * Tento skript je vložen do webových stránek a umožňuje jim komunikovat
 * s rozšířením a lokální aplikací LAN-over-Internet.
 */

// Globální proměnné
let isConnected = false;
let connectedClient = null;
let webrtcBridgeInjected = false;

// Inicializace
init();

// Funkce pro inicializaci
async function init() {
    console.log('LAN-over-Internet Content Script načten');
    
    // Kontrola stavu připojení
    checkConnectionStatus();
    
    // Vložení WebRTC Bridge skriptu
    injectWebRTCBridge();
    
    // Naslouchání na zprávy od background skriptu
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    
    // Naslouchání na zprávy od webové stránky
    window.addEventListener('message', handleWebPageMessage);
}

// Funkce pro kontrolu stavu připojení
async function checkConnectionStatus() {
    try {
        const status = await chrome.runtime.sendMessage({ action: 'getConnectionStatus' });
        updateConnectionStatus(status.connected, status.client);
    } catch (error) {
        console.error('Chyba při získávání stavu připojení:', error);
    }
}

// Funkce pro vložení WebRTC Bridge skriptu
function injectWebRTCBridge() {
    if (webrtcBridgeInjected) {
        return;
    }
    
    try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('webrtc-bridge.js');
        script.onload = function() {
            webrtcBridgeInjected = true;
            console.log('WebRTC Bridge skript úspěšně vložen');
            
            // Informování webové stránky o stavu připojení
            notifyWebPageAboutConnectionStatus();
        };
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.error('Chyba při vkládání WebRTC Bridge skriptu:', error);
    }
}

// Funkce pro aktualizaci stavu připojení
function updateConnectionStatus(connected, client) {
    isConnected = connected;
    connectedClient = client;
    
    console.log('Stav připojení aktualizován:', { connected, client });
    
    // Informování webové stránky o stavu připojení
    notifyWebPageAboutConnectionStatus();
}

// Funkce pro informování webové stránky o stavu připojení
function notifyWebPageAboutConnectionStatus() {
    if (!webrtcBridgeInjected) {
        return;
    }
    
    window.postMessage({
        source: 'webrtc-bridge-extension',
        action: 'connectionStateChanged',
        state: isConnected ? 'connected' : 'disconnected',
        client: connectedClient
    }, '*');
}

// Funkce pro zpracování zpráv od background skriptu
function handleBackgroundMessage(message, sender, sendResponse) {
    console.log('Content script přijal zprávu od background skriptu:', message);
    
    if (message.action === 'connectionStatusChanged') {
        // Aktualizace stavu připojení
        updateConnectionStatus(message.connected, message.client);
        // Předání informace o změně stavu připojení do webové stránky
        if (webrtcBridgeInjected) {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'connectionStatus',
                connected: message.connected,
                clientInfo: message.client,
                webrtcConnected: message.webrtcConnected
            }, '*');
        }
        sendResponse({ success: true });
        return true;
    } else if (message.action === 'messageReceived') {
        // Předání přijaté zprávy do webové stránky
        if (webrtcBridgeInjected) {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'messageReceived',
                message: message.message
            }, '*');
        }
        sendResponse({ success: true });
        return true;
    } else if (message.action === 'webrtcConnected') {
        // Předání informace o navázání WebRTC připojení do webové stránky
        if (webrtcBridgeInjected) {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'webrtcConnected'
            }, '*');
        }
        sendResponse({ success: true });
        return true;
    } else if (message.action === 'webrtcDisconnected') {
        // Předání informace o ukončení WebRTC připojení do webové stránky
        if (webrtcBridgeInjected) {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'webrtcConnected'
            }, '*');
        }
        sendResponse({ success: true });
        return true;
    } else if (message.action === 'webrtcDisconnected') {
        // Předání informace o ukončení WebRTC připojení do webové stránky
        if (webrtcBridgeInjected) {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'webrtcDisconnected'
            }, '*');
        }
        sendResponse({ success: true });
        return true;
    }
    
    return false;
}

// Funkce pro zpracování zpráv od webové stránky
function handleWebPageMessage(event) {
    // Ignorování zpráv, které nepocházejí z této stránky
    if (event.source !== window || !event.data || event.data.source !== 'webrtc-bridge') {
        return;
    }
    
    const message = event.data;
    console.log('Content script přijal zprávu od webové stránky:', message);
    
    if (message.action === 'getConnectionStatus') {
        // Odpověď na požadavek o stavu připojení
        chrome.runtime.sendMessage({ action: 'getConnectionStatus' }).then(response => {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'connectionStatus',
                connected: response.connected,
                clientInfo: response.client,
                webrtcConnected: response.webrtcConnected,
                 requestId: event.data.requestId
            }, '*');
        }).catch(error => {
            console.error('Chyba při získávání stavu připojení:', error);
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'connectionStatusResult',
                success: false,
                error: error.message,
                requestId: event.data.requestId
            }, '*');
        });
    } else if (message.action === 'connect') {
        // Předání požadavku na připojení do background skriptu
        chrome.runtime.sendMessage({
            action: 'connect',
            clientName: message.clientName,
            pinCode: message.pinCode
        }).then(response => {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'connectResult',
                success: response.success,
                error: response.error,
                clientInfo: response.client,
                 requestId: event.data.requestId
            }, '*');
        }).catch(error => {
            console.error('Chyba při připojování k lokální aplikaci:', error);
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'connectResult',
                success: false,
                error: error.message,
                 requestId: event.data.requestId
            }, '*');
        });
    } else if (message.action === 'disconnect') {
        // Předání požadavku na odpojení do background skriptu
        chrome.runtime.sendMessage({
            action: 'disconnect'
        }).then(response => {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'disconnectResult',
                success: response.success,
                error: response.error,
                 requestId: event.data.requestId
            }, '*');
        }).catch(error => {
            console.error('Chyba při odpojování od lokální aplikace:', error);
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'disconnectResult',
                success: false,
                error: error.message,
                requestId: message.requestId
            }, '*');
        });
    } else if (message.action === 'sendMessage') {
        // Předání zprávy do background skriptu pro odeslání přes WebRTC
        chrome.runtime.sendMessage({
            action: 'sendMessage',
            message: event.data.message,
            messageId: event.data.messageId
        }).then(response => {
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'sendMessageResult',
                success: response.success,
                error: response.error,
                messageId: message.messageId
            }, '*');
        }).catch(error => {
            console.error('Chyba při odesílání zprávy přes WebRTC:', error);
            window.postMessage({
                source: 'webrtc-bridge-extension',
                action: 'sendMessageResult',
                success: false,
                error: error.message,
                messageId: message.messageId
            }, '*');
        });
    }
}