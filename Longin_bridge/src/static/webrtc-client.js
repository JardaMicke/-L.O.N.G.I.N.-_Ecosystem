/**
 * WebRTC P2P Client for LAN-over-Internet Application
 * Handles peer-to-peer connections and data channels for network simulation
 */

class WebRTCClient {
    constructor(socketClient) {
        this.socket = socketClient;
        this.peerConnections = new Map(); // Map of peerId -> RTCPeerConnection
        this.dataChannels = new Map(); // Map of peerId -> RTCDataChannel
        this.localClientId = null;
        this.localClientName = null;
        
        // WebRTC configuration with STUN servers
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        
        // Event callbacks
        this.onPeerConnected = null;
        this.onPeerDisconnected = null;
        this.onDataReceived = null;
        this.onConnectionStateChange = null;
        
        this.setupSocketHandlers();
    }
    
    setupSocketHandlers() {
        // Handle WebRTC signaling messages
        this.socket.on('webrtc_offer', (data) => {
            this.handleOffer(data.fromId, data.offer);
        });
        
        this.socket.on('webrtc_answer', (data) => {
            this.handleAnswer(data.fromId, data.answer);
        });
        
        this.socket.on('webrtc_ice_candidate', (data) => {
            this.handleIceCandidate(data.fromId, data.candidate);
        });
        
        this.socket.on('connection_accepted', (data) => {
            this.initiateConnection(data.fromId);
        });
        
        this.socket.on('peer_disconnected', (data) => {
            this.closePeerConnection(data.peerId);
        });
    }
    
    setClientInfo(clientId, clientName) {
        this.localClientId = clientId;
        this.localClientName = clientName;
    }
    
    /**
     * Initiate connection to a peer
     */
    async initiateConnection(peerId) {
        try {
            console.log(`Initiating connection to peer: ${peerId}`);
            
            const peerConnection = this.createPeerConnection(peerId);
            this.peerConnections.set(peerId, peerConnection);
            
            // Create data channel for network communication
            const dataChannel = peerConnection.createDataChannel('network', {
                ordered: true,
                maxRetransmits: 3
            });
            
            this.setupDataChannel(dataChannel, peerId);
            this.dataChannels.set(peerId, dataChannel);
            
            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            this.socket.emit('webrtc_offer', {
                targetId: peerId,
                offer: offer
            });
            
        } catch (error) {
            console.error('Error initiating connection:', error);
            this.notifyConnectionStateChange(peerId, 'failed');
        }
    }
    
    /**
     * Handle incoming WebRTC offer
     */
    async handleOffer(peerId, offer) {
        try {
            console.log(`Received offer from peer: ${peerId}`);
            
            const peerConnection = this.createPeerConnection(peerId);
            this.peerConnections.set(peerId, peerConnection);
            
            // Set up data channel handler for incoming connections
            peerConnection.ondatachannel = (event) => {
                const dataChannel = event.channel;
                this.setupDataChannel(dataChannel, peerId);
                this.dataChannels.set(peerId, dataChannel);
            };
            
            await peerConnection.setRemoteDescription(offer);
            
            // Create and send answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            this.socket.emit('webrtc_answer', {
                targetId: peerId,
                answer: answer
            });
            
        } catch (error) {
            console.error('Error handling offer:', error);
            this.notifyConnectionStateChange(peerId, 'failed');
        }
    }
    
    /**
     * Handle incoming WebRTC answer
     */
    async handleAnswer(peerId, answer) {
        try {
            console.log(`Received answer from peer: ${peerId}`);
            
            const peerConnection = this.peerConnections.get(peerId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(answer);
            }
            
        } catch (error) {
            console.error('Error handling answer:', error);
            this.notifyConnectionStateChange(peerId, 'failed');
        }
    }
    
    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate(peerId, candidate) {
        try {
            const peerConnection = this.peerConnections.get(peerId);
            if (peerConnection && candidate) {
                await peerConnection.addIceCandidate(candidate);
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }
    
    /**
     * Create a new RTCPeerConnection
     */
    createPeerConnection(peerId) {
        const peerConnection = new RTCPeerConnection(this.rtcConfig);
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('webrtc_ice_candidate', {
                    targetId: peerId,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            console.log(`Connection state with ${peerId}: ${state}`);
            
            this.notifyConnectionStateChange(peerId, state);
            
            if (state === 'connected') {
                // Notify server about successful connection
                this.socket.emit('connection_established', {
                    targetId: peerId
                });
                
                if (this.onPeerConnected) {
                    this.onPeerConnected(peerId);
                }
            } else if (state === 'disconnected' || state === 'failed') {
                this.closePeerConnection(peerId);
            }
        };
        
        // Handle ICE connection state changes
        peerConnection.oniceconnectionstatechange = () => {
            const state = peerConnection.iceConnectionState;
            console.log(`ICE connection state with ${peerId}: ${state}`);
        };
        
        return peerConnection;
    }
    
    /**
     * Set up data channel event handlers
     */
    setupDataChannel(dataChannel, peerId) {
        dataChannel.onopen = () => {
            console.log(`Data channel opened with peer: ${peerId}`);
        };
        
        dataChannel.onclose = () => {
            console.log(`Data channel closed with peer: ${peerId}`);
        };
        
        dataChannel.onmessage = (event) => {
            this.handleDataChannelMessage(peerId, event.data);
        };
        
        dataChannel.onerror = (error) => {
            console.error(`Data channel error with ${peerId}:`, error);
        };
    }
    
    /**
     * Handle incoming data channel messages
     */
    handleDataChannelMessage(peerId, data) {
        try {
            const message = JSON.parse(data);
            console.log(`Received data from ${peerId}:`, message);
            
            if (this.onDataReceived) {
                this.onDataReceived(peerId, message);
            }
            
            // Handle different types of network messages
            switch (message.type) {
                case 'ping':
                    this.sendToPeer(peerId, {
                        type: 'pong',
                        timestamp: Date.now(),
                        originalTimestamp: message.timestamp
                    });
                    break;
                    
                case 'pong':
                    const latency = Date.now() - message.originalTimestamp;
                    console.log(`Ping to ${peerId}: ${latency}ms`);
                    break;
                    
                case 'network_packet':
                    // Handle simulated network packets
                    this.handleNetworkPacket(peerId, message.packet);
                    break;
                    
                default:
                    console.log(`Unknown message type from ${peerId}:`, message.type);
            }
            
        } catch (error) {
            console.error('Error parsing data channel message:', error);
        }
    }
    
    /**
     * Send data to a specific peer
     */
    sendToPeer(peerId, data) {
        const dataChannel = this.dataChannels.get(peerId);
        if (dataChannel && dataChannel.readyState === 'open') {
            try {
                dataChannel.send(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error(`Error sending data to ${peerId}:`, error);
                return false;
            }
        }
        return false;
    }
    
    /**
     * Send ping to a peer to test connectivity
     */
    pingPeer(peerId) {
        return this.sendToPeer(peerId, {
            type: 'ping',
            timestamp: Date.now()
        });
    }
    
    /**
     * Simulate sending a network packet
     */
    sendNetworkPacket(peerId, packet) {
        return this.sendToPeer(peerId, {
            type: 'network_packet',
            packet: packet,
            timestamp: Date.now()
        });
    }
    
    /**
     * Handle simulated network packets
     */
    handleNetworkPacket(peerId, packet) {
        console.log(`Received network packet from ${peerId}:`, packet);
        // Here you would implement actual network packet handling
        // For simulation purposes, we'll just log it
    }
    
    /**
     * Disconnect from a specific peer
     */
    disconnectFromPeer(peerId) {
        console.log(`Disconnecting from peer: ${peerId}`);
        
        // Notify server
        this.socket.emit('disconnect_peer', {
            targetId: peerId
        });
        
        this.closePeerConnection(peerId);
    }
    
    /**
     * Close peer connection and clean up
     */
    closePeerConnection(peerId) {
        // Close data channel
        const dataChannel = this.dataChannels.get(peerId);
        if (dataChannel) {
            dataChannel.close();
            this.dataChannels.delete(peerId);
        }
        
        // Close peer connection
        const peerConnection = this.peerConnections.get(peerId);
        if (peerConnection) {
            peerConnection.close();
            this.peerConnections.delete(peerId);
        }
        
        if (this.onPeerDisconnected) {
            this.onPeerDisconnected(peerId);
        }
    }
    
    /**
     * Get list of connected peers
     */
    getConnectedPeers() {
        const connectedPeers = [];
        for (const [peerId, peerConnection] of this.peerConnections) {
            if (peerConnection.connectionState === 'connected') {
                connectedPeers.push(peerId);
            }
        }
        return connectedPeers;
    }
    
    /**
     * Check if connected to a specific peer
     */
    isConnectedToPeer(peerId) {
        const peerConnection = this.peerConnections.get(peerId);
        return peerConnection && peerConnection.connectionState === 'connected';
    }
    
    /**
     * Notify about connection state changes
     */
    notifyConnectionStateChange(peerId, state) {
        if (this.onConnectionStateChange) {
            this.onConnectionStateChange(peerId, state);
        }
    }
    
    /**
     * Clean up all connections
     */
    cleanup() {
        console.log('Cleaning up WebRTC client...');
        
        // Close all peer connections
        for (const peerId of this.peerConnections.keys()) {
            this.closePeerConnection(peerId);
        }
        
        this.peerConnections.clear();
        this.dataChannels.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCClient;
}

