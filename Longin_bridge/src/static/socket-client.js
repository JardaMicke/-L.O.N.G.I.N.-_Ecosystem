/**
 * Socket.IO Client for LAN-over-Internet Application
 * Handles communication with the signaling server
 */

class SocketClient {
    constructor() {
        this.socket = null;
        this.clientId = null;
        this.clientName = null;
        this.isConnected = false;
        this.peers = new Map(); // Map of peerId -> peer info
        
        // Event callbacks
        this.onConnected = null;
        this.onDisconnected = null;
        this.onPeerListUpdated = null;
        this.onConnectionRequest = null;
        this.onConnectionAccepted = null;
        this.onConnectionRejected = null;
        this.onError = null;
        this.onServiceAdded = null;
        this.onServiceError = null;
        this.onSharedFolderCreated = null;
        this.onFolderError = null;
        this.onSharedFolderList = null;
    }
    
    /**
     * Connect to the signaling server
     */
    connect(serverUrl = window.location.origin) {
        return new Promise((resolve, reject) => {
            try {
                // Initialize Socket.IO connection
                this.socket = io(serverUrl, {
                    transports: ['websocket', 'polling'],
                    timeout: 10000
                });
                
                this.setupEventHandlers();
                
                // Wait for connection
                this.socket.on('connected', (data) => {
                    this.clientId = data.clientId;
                    this.isConnected = true;
                    console.log('Connected to signaling server:', data);
                    
                    if (this.onConnected) {
                        this.onConnected(data);
                    }
                    
                    resolve(data);
                });
                
                // Handle connection errors
                this.socket.on('connect_error', (error) => {
                    console.error('Connection error:', error);
                    reject(error);
                });
                
            } catch (error) {
                console.error('Error connecting to server:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Set up Socket.IO event handlers
     */
    setupEventHandlers() {
        // Connection events
        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.isConnected = false;
            this.clientId = null;
            
            if (this.onDisconnected) {
                this.onDisconnected(reason);
            }
        });
        
        // Registration confirmation
        this.socket.on('registration_confirmed', (data) => {
            console.log('Registration confirmed:', data);
            this.clientId = data.clientId;
            this.clientName = data.clientName;
        });
        
        // Peer list updates
        this.socket.on('peer_list', (data) => {
            console.log('Peer list updated:', data.peers);
            this.updatePeerList(data.peers);
        });
        
        // Connection requests
        this.socket.on('connection_request', (data) => {
            console.log('Connection request from:', data);
            if (this.onConnectionRequest) {
                this.onConnectionRequest(data);
            }
        });
        
        // Connection responses
        this.socket.on('connection_accepted', (data) => {
            console.log('Connection accepted by:', data);
            if (this.onConnectionAccepted) {
                this.onConnectionAccepted(data);
            }
        });
        
        this.socket.on('connection_rejected', (data) => {
            console.log('Connection rejected by:', data);
            if (this.onConnectionRejected) {
                this.onConnectionRejected(data);
            }
        });
        
        // Peer connection events
        this.socket.on('peer_connected', (data) => {
            console.log('Peer connected:', data);
            this.updatePeerStatus(data.peerId, 'connected');
        });
        
        this.socket.on('peer_disconnected', (data) => {
            console.log('Peer disconnected:', data);
            this.updatePeerStatus(data.peerId, 'online');
        });
        
        // Error handling
        this.socket.on('connection_error', (data) => {
            console.error('Connection error:', data);
            if (this.onError) {
                this.onError(data);
            }
        });
        
        this.socket.on('webrtc_error', (data) => {
            console.error('WebRTC error:', data);
            if (this.onError) {
                this.onError(data);
            }
        });

        // Service events
        this.socket.on('service_added', (data) => {
            console.log('Service added:', data);
            if (this.onServiceAdded) {
                this.onServiceAdded(data);
            }
        });

        this.socket.on('service_error', (data) => {
            console.error('Service error:', data);
            if (this.onServiceError) {
                this.onServiceError(data);
            }
        });

        // Shared folder events
        this.socket.on('shared_folder_created', (data) => {
            console.log('Shared folder created:', data);
            if (this.onSharedFolderCreated) {
                this.onSharedFolderCreated(data);
            }
        });

        this.socket.on('folder_error', (data) => {
            console.error('Folder error:', data);
            if (this.onFolderError) {
                this.onFolderError(data);
            }
        });

        this.socket.on('shared_folder_list', (data) => {
            console.log('Shared folder list:', data);
            if (this.onSharedFolderList) {
                this.onSharedFolderList(data);
            }
        });
    }
    
    /**
     * Register client with the server
     */
    register(clientName) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        this.clientName = clientName;
        this.socket.emit('register', {
            clientName: clientName
        });
        
        // Request initial peer list
        this.requestPeerList();
    }
    
    /**
     * Request current peer list from server
     */
    requestPeerList() {
        if (this.isConnected) {
            this.socket.emit('get_peer_list');
        }
    }
    
    /**
     * Send connection request to a peer
     */
    requestConnection(peerId) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        console.log(`Requesting connection to peer: ${peerId}`);
        this.socket.emit('connect_request', {
            targetId: peerId
        });
    }
    
    /**
     * Respond to a connection request
     */
    respondToConnection(peerId, accepted) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        console.log(`Responding to connection from ${peerId}: ${accepted ? 'accepted' : 'rejected'}`);
        this.socket.emit('connection_response', {
            targetId: peerId,
            accepted: accepted
        });
    }
    
    /**
     * Update peer list
     */
    updatePeerList(peerList) {
        this.peers.clear();
        
        peerList.forEach(peer => {
            this.peers.set(peer.id, {
                id: peer.id,
                name: peer.name,
                status: peer.status
            });
        });
        
        if (this.onPeerListUpdated) {
            this.onPeerListUpdated(Array.from(this.peers.values()));
        }
    }
    
    /**
     * Update status of a specific peer
     */
    updatePeerStatus(peerId, status) {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.status = status;
            
            if (this.onPeerListUpdated) {
                this.onPeerListUpdated(Array.from(this.peers.values()));
            }
        }
    }
    
    /**
     * Get peer information
     */
    getPeer(peerId) {
        return this.peers.get(peerId);
    }
    
    /**
     * Get all peers
     */
    getAllPeers() {
        return Array.from(this.peers.values());
    }
    
    /**
     * Get peers with specific status
     */
    getPeersByStatus(status) {
        return Array.from(this.peers.values()).filter(peer => peer.status === status);
    }
    
    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.clientId = null;
        this.clientName = null;
        this.peers.clear();
    }
    
    /**
     * Check if connected to server
     */
    isConnectedToServer() {
        return this.isConnected && this.socket && this.socket.connected;
    }
    
    /**
     * Get client information
     */
    getClientInfo() {
        return {
            id: this.clientId,
            name: this.clientName,
            isConnected: this.isConnected
        };
    }
    
    /**
     * Emit custom event to server
     */
    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        }
    }
    
    /**
     * Listen for custom events from server
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }
    
    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocketClient;
}

