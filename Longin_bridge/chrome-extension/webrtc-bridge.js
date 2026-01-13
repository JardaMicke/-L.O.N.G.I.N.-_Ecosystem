/**
 * LAN-over-Internet WebRTC Bridge
 * 
 * Tento skript poskytuje API pro webové stránky, které chtějí komunikovat
 * s lokální aplikací LAN-over-Internet přes WebRTC.
 */

(function() {
    // Globální proměnné
    let isConnected = false;
    let connectedClient = null;
    let connectionStateListeners = [];
    let messageListeners = [];
    
    // Vytvoření globálního objektu pro API
    window.WebRTCBridge = {
        // Kontrola, zda je připojeno k lokální aplikaci
        isConnected: function() {
            return isConnected;
        },
        
        // Získání informací o připojeném klientovi
        getConnectedClientName: function() {
            return connectedClient ? connectedClient.name : null;
        },
        
        // Připojení k lokální aplikaci
        connect: function(clientName, pinCode) {
            return new Promise((resolve, reject) => {
                if (isConnected) {
                    resolve(connectedClient);
                    return;
                }
                
                // Odeslání požadavku na připojení
                window.postMessage({
                    source: 'webrtc-bridge',
                    action: 'connect',
                    clientName: clientName || 'WebRTC Client',
                    pinCode: pinCode || ''
                }, '*');
                
                // Nastavení timeoutu pro případ, že se nepodaří připojit
                const timeout = setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    reject(new Error('Timeout při připojování k lokální aplikaci'));
                }, 30000);
                
                // Naslouchání na odpověď
                const messageHandler = (event) => {
                    if (event.source !== window || !event.data || 
                        event.data.source !== 'webrtc-bridge-extension' || 
                        event.data.action !== 'connectResult') {
                        return;
                    }
                    
                    // Zrušení timeoutu
                    clearTimeout(timeout);
                    
                    // Odebrání posluchače
                    window.removeEventListener('message', messageHandler);
                    
                    if (event.data.success) {
                        resolve(event.data.clientInfo);
                    } else {
                        reject(new Error(event.data.error || 'Nepodařilo se připojit k lokální aplikaci'));
                    }
                };
                
                window.addEventListener('message', messageHandler);
            });
        },
        
        // Odpojení od lokální aplikace
        disconnect: function() {
            return new Promise((resolve, reject) => {
                if (!isConnected) {
                    resolve();
                    return;
                }
                
                // Odeslání požadavku na odpojení
                window.postMessage({
                    source: 'webrtc-bridge',
                    action: 'disconnect'
                }, '*');
                
                // Nastavení timeoutu pro případ, že se nepodaří odpojit
                const timeout = setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    reject(new Error('Timeout při odpojování od lokální aplikace'));
                }, 5000);
                
                // Naslouchání na odpověď
                const messageHandler = (event) => {
                    if (event.source !== window || !event.data || 
                        event.data.source !== 'webrtc-bridge-extension' || 
                        event.data.action !== 'disconnectResult') {
                        return;
                    }
                    
                    // Zrušení timeoutu
                    clearTimeout(timeout);
                    
                    // Odebrání posluchače
                    window.removeEventListener('message', messageHandler);
                    
                    if (event.data.success) {
                        resolve();
                    } else {
                        reject(new Error(event.data.error || 'Nepodařilo se odpojit od lokální aplikace'));
                    }
                };
                
                window.addEventListener('message', messageHandler);
            });
        },
        
        // Nastavení posluchače pro změny stavu připojení
        onConnectionStateChange: function(callback) {
            if (typeof callback !== 'function') {
                return this;
            }
            
            // Přidání posluchače
            connectionStateListeners.push(callback);
            
            // Okamžité volání posluchače s aktuálním stavem
            if (isConnected) {
                callback('connected', connectedClient ? connectedClient.name : null);
            } else {
                callback('disconnected', null);
            }
            
            return this;
        },
        
        // Odeslání zprávy přes WebRTC
        sendMessage: function(message) {
            if (!isConnected) {
                return Promise.reject(new Error('Není navázáno připojení k lokální aplikaci'));
            }
            
            return new Promise((resolve, reject) => {
                // Generování ID zprávy pro sledování odpovědi
                const messageId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
                
                // Odeslání zprávy
                window.postMessage({
                    source: 'webrtc-bridge',
                    action: 'sendMessage',
                    message: message,
                    messageId: messageId
                }, '*');
                
                // Nastavení timeoutu pro případ, že se zpráva nepodaří odeslat
                const timeout = setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    reject(new Error('Timeout při odesílání zprávy'));
                }, 5000);
                
                // Naslouchání na odpověď
                const messageHandler = (event) => {
                    if (event.source !== window || !event.data || 
                        event.data.source !== 'webrtc-bridge-extension' || 
                        event.data.action !== 'sendMessageResult' ||
                        event.data.messageId !== messageId) {
                        return;
                    }
                    
                    // Zrušení timeoutu
                    clearTimeout(timeout);
                    
                    // Odebrání posluchače
                    window.removeEventListener('message', messageHandler);
                    
                    if (event.data.success) {
                        resolve();
                    } else {
                        reject(new Error(event.data.error || 'Nepodařilo se odeslat zprávu'));
                    }
                };
                
                window.addEventListener('message', messageHandler);
            });
        },
        
        // Nastavení posluchače pro příchozí zprávy
        onMessage: function(callback) {
            if (typeof callback !== 'function') {
                return this;
            }
            
            // Přidání posluchače
            messageListeners.push(callback);
            
            return this;
        }
    };
    
    // Poslouchání zpráv od content skriptu
    window.addEventListener('message', (event) => {
        // Ignorování zpráv, které nepocházejí z content skriptu
        if (event.source !== window || !event.data || event.data.source !== 'webrtc-bridge-extension') {
            return;
        }
        
        const message = event.data;
        
        if (message.action === 'connectionStatus') {
            // Aktualizace stavu připojení
            isConnected = message.connected;
            connectedClient = message.clientInfo;
            
            // Volání posluchačů pro změny stavu připojení
            connectionStateListeners.forEach(listener => {
                try {
                    listener(message.connected ? 'connected' : 'disconnected', 
                             connectedClient ? connectedClient.name : null);
                } catch (error) {
                    console.error('Chyba v posluchači stavu připojení:', error);
                }
            });
        } else if (message.action === 'webrtcConnected') {
            console.log('WebRTC připojení navázáno');
            // Volání posluchačů pro změny stavu připojení
            connectionStateListeners.forEach(listener => {
                try {
                    listener('webrtc_connected', connectedClient ? connectedClient.name : null);
                } catch (error) {
                    console.error('Chyba v posluchači stavu připojení:', error);
                }
            });
        } else if (message.action === 'webrtcDisconnected') {
            console.log('WebRTC připojení ukončeno');
            // Volání posluchačů pro změny stavu připojení
            connectionStateListeners.forEach(listener => {
                try {
                    listener('webrtc_disconnected', connectedClient ? connectedClient.name : null);
                } catch (error) {
                    console.error('Chyba v posluchači stavu připojení:', error);
                }
            });
        } else if (message.action === 'messageReceived') {
            // Volání posluchačů pro příchozí zprávy
            messageListeners.forEach(listener => {
                try {
                    listener(message.message);
                } catch (error) {
                    console.error('Chyba v posluchači zpráv:', error);
                }
            });
        }
    });
    
    // Odeslání požadavku na získání stavu připojení
    window.postMessage({
        source: 'webrtc-bridge',
        action: 'getConnectionStatus'
    }, '*');
    
    // Oznámení, že skript byl načten
    console.log('WebRTC Bridge API načteno');
    
    // Vyvolání události, že WebRTC Bridge API je připraveno
    window.dispatchEvent(new Event('WebRTCBridgeReady'));
})();