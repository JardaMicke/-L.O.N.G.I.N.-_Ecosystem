/**
 * Main Application Controller for LAN-over-Internet
 * Integrates Socket.IO client, WebRTC client, and UI management
 */

class LANOverInternetApp {
    constructor() {
        this.socketClient = null;
        this.webrtcClient = null;
        this.isConnected = false;
        this.currentConnectionRequest = null;
        this.connectedPeers = new Set();
        this.pingResults = new Map();
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadClientName();
    }
    
    initializeElements() {
        // Connection setup elements
        this.connectionSetup = document.getElementById('connectionSetup');
        this.dashboard = document.getElementById('dashboard');
        this.clientNameInput = document.getElementById('clientName');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        
        // Status elements
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        
        // Client info elements
        this.clientNameDisplay = document.getElementById('clientNameDisplay');
        this.clientIdDisplay = document.getElementById('clientIdDisplay');
        this.clientStatusDisplay = document.getElementById('clientStatusDisplay');
        
        // Peer list elements
        this.peerList = document.getElementById('peerList');
        this.refreshBtn = document.getElementById('refreshBtn');
        
        // Connections list
        this.connectionsList = document.getElementById('connectionsList');

        // Add Service elements
        this.addServiceBtn = document.getElementById('addServiceBtn');
        this.addServiceForm = document.getElementById('addServiceForm');
        this.cancelAddServiceBtn = document.getElementById('cancelAddServiceBtn');
        this.saveServiceBtn = document.getElementById('saveServiceBtn');

        // Disk button
        this.diskBtn = document.getElementById('diskBtn');

        // Shared folders list
        this.sharedFoldersList = document.getElementById('sharedFoldersList');
        this.folderContentsView = document.getElementById('folderContentsView');
        this.folderContentsList = document.getElementById('folderContentsList');
        this.backToFoldersBtn = document.getElementById('backToFoldersBtn');
        
        // Chat elements
        this.chatSection = document.getElementById('chatSection');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatMessageInput');
        this.chatSendBtn = document.getElementById('sendChatMessageBtn');

        // Tool buttons
        this.pingAllBtn = document.getElementById('pingAllBtn');
        this.showStatsBtn = document.getElementById('showStatsBtn');
        this.disconnectAllBtn = document.getElementById('disconnectAllBtn');
        
        // Modal elements
        this.connectionRequestModal = document.getElementById('connectionRequestModal');
        this.connectionRequestText = document.getElementById('connectionRequestText');
        this.acceptConnectionBtn = document.getElementById('acceptConnectionBtn');
        this.rejectConnectionBtn = document.getElementById('rejectConnectionBtn');
        
        this.statisticsModal = document.getElementById('statisticsModal');
        this.closeStatsModal = document.getElementById('closeStatsModal');
        this.statisticsContent = document.getElementById('statisticsContent');

        // Add Folder Modal elements
        this.addFolderModal = document.getElementById('addFolderModal');
        this.addFolderBtn = document.getElementById('addFolderBtn');
        this.cancelAddFolderBtn = document.getElementById('cancelAddFolderBtn');
        this.saveFolderBtn = document.getElementById('saveFolderBtn');
        this.folderPathInput = document.getElementById('folderPath');
        this.folderSizeInput = document.getElementById('folderSize');

        // LLM Chat elements
        this.llmChatSection = document.getElementById('llm-chat-section');
        this.llmChatMessages = document.getElementById('llm-chat-messages');
        this.llmChatInputForm = document.getElementById('llm-chat-input-form');
        this.llmChatInput = document.getElementById('llm-chat-input');

        // Notifications container
        this.notifications = document.getElementById('notifications');
    }
    
    setupEventListeners() {
        // Connection buttons
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.refreshBtn.addEventListener('click', () => this.refreshPeerList());
        
        // Tool buttons
        this.pingAllBtn.addEventListener('click', () => this.pingAllPeers());
        this.showStatsBtn.addEventListener('click', () => this.showStatistics());
        this.disconnectAllBtn.addEventListener('click', () => this.disconnectAllPeers());

        // Add Service buttons
        this.addServiceBtn.addEventListener('click', () => this.toggleServiceForm(true));
        this.cancelAddServiceBtn.addEventListener('click', () => this.toggleServiceForm(false));
        this.saveServiceBtn.addEventListener('click', () => this.saveService());

        // Add Folder buttons
        this.addFolderBtn.addEventListener('click', () => this.toggleAddFolderModal(true));
        this.cancelAddFolderBtn.addEventListener('click', () => this.toggleAddFolderModal(false));
        this.saveFolderBtn.addEventListener('click', () => this.saveSharedFolder());

        // Disk button
        this.diskBtn.addEventListener('click', () => this.handleDisk());
        
        // Modal buttons
        this.acceptConnectionBtn.addEventListener('click', () => this.acceptConnection());
        this.rejectConnectionBtn.addEventListener('click', () => this.rejectConnection());
        this.closeStatsModal.addEventListener('click', () => this.hideStatistics());

        // Back to folders button
        this.backToFoldersBtn.addEventListener('click', () => {
            this.folderContentsView.style.display = 'none';
            document.getElementById('shared-folders-section').style.display = 'block';
        });

        // Enter key support
        this.clientNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connect();
            }
        });
        
        // Modal background click to close
        this.statisticsModal.addEventListener('click', (e) => {
            if (e.target === this.statisticsModal) {
                this.hideStatistics();
            }
        });
        
        // Auto-save client name
        this.clientNameInput.addEventListener('input', () => {
            localStorage.setItem('clientName', this.clientNameInput.value);
        });

        // Chat listeners
        this.chatSendBtn.addEventListener('click', () => this.sendChatMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // LLM Chat listener
        this.llmChatInputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendLLMChatMessage();
        });
    }

    displayFolderContents(folderName, contents) {
        document.getElementById('shared-folders-section').style.display = 'none';
        this.folderContentsView.style.display = 'block';

        this.folderContentsList.innerHTML = ''; // Clear previous contents

        if (contents && contents.length > 0) {
            contents.forEach(item => {
                const listItem = document.createElement('div');
                listItem.className = 'file-item';
                listItem.innerHTML = `
                    <i class="fas ${item.type === 'directory' ? 'fa-folder' : 'fa-file'}"></i>
                    <span>${item.name}</span>
                `;
                this.folderContentsList.appendChild(listItem);
            });
        } else {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Tato složka je prázdná.';
            this.folderContentsList.appendChild(emptyMessage);
        }
    }

    sendChatMessage() {
        const message = this.chatInput.value.trim();
        if (message && this.socketClient) {
            const messageData = {
                senderName: this.clientNameInput.value.trim(),
                message: message,
            };
            this.socketClient.socket.emit('chat_message', messageData);
            this.displayChatMessage(messageData, true); // Display sent message immediately
            this.chatInput.value = '';
        }
    }

    displayChatMessage(data, isSent) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', isSent ? 'sent' : 'received');
        
        const senderInitial = data.senderName ? data.senderName.charAt(0).toUpperCase() : '?';

        messageElement.innerHTML = `
            <div class="message-header">${data.senderName}</div>
            <div class="message-content">${data.message}</div>
        `;
        
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight; // Scroll to bottom
    }

    updateSharedFoldersList(folders) {
        if (!folders || folders.length === 0) {
            this.sharedFoldersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>Žádné sdílené složky</p>
                </div>
            `;
            return;
        }

        this.sharedFoldersList.innerHTML = folders.map(folder => `
            <div class="folder-item" data-folder-name="${folder.name}" data-folder-path="${folder.path}">
                <div class="folder-main-action">
                    <i class="fas fa-folder"></i>
                    <div class="folder-info">
                        <span class="folder-name">${folder.name}</span>
                        <span class="folder-size">${folder.size ? folder.size + ' MB' : 'N/A'}</span>
                    </div>
                </div>
                <div class="folder-actions">
                    <button class="btn btn-secondary btn-small change-folder-btn">
                        <i class="fas fa-edit"></i> Změnit
                    </button>
                    <button class="btn btn-danger btn-small delete-folder-btn">
                        <i class="fas fa-trash-alt"></i> Smazat
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        this.sharedFoldersList.querySelectorAll('.folder-item').forEach(item => {
            const folderName = item.dataset.folderName;

            // Click on main area to browse (to be implemented)
            item.querySelector('.folder-main-action').addEventListener('click', () => {
                this.socketClient.socket.emit('list_folder_contents', { folderName });
            });

            // Click on "Change" button
            item.querySelector('.change-folder-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent folder browsing event
                this.showNotification(`Změna konfigurace pro "${folderName}" bude brzy implementována.`, 'info');
            });

            // Click on "Delete" button
            item.querySelector('.delete-folder-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent folder browsing event
                if (confirm(`Opravdu si přejete smazat složku "${folderName}"?`)) {
                    this.socketClient.socket.emit('delete_shared_folder', { folderName });
                }
            });
        });
    }

    openFolderManagementModal(folderName, folderPath) {
        document.getElementById('folderNameDisplay').textContent = folderName;
        document.getElementById('folderPathDisplay').textContent = folderPath;
        this.folderManagementModal.style.display = 'block';
    }

    closeFolderManagementModal() {
        this.folderManagementModal.style.display = 'none';
    }

    getServicesHTML(services) {
        if (!services || services.length === 0) {
            return '<p class="no-services">Žádné služby nejsou k dispozici.</p>';
        }

        return '<ul>' + services.map(service => `
            <li>
                <strong>${service.name}</strong>: <a href="${service.url}" target="_blank">${service.url}</a>
                (Porty: ${service.ports || 'N/A'})
            </li>
        `).join('') + '</ul>';
    }
    
    loadClientName() {
        const savedName = localStorage.getItem('clientName');
        if (savedName) {
            this.clientNameInput.value = savedName;
        }
    }
    
    async connect() {
        const clientName = this.clientNameInput.value.trim();
        if (!clientName) {
            this.showNotification('Zadejte název počítače', 'error');
            return;
        }
        
        try {
            this.setConnectionStatus('connecting', 'Připojování...');
            this.connectBtn.disabled = true;
            this.connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Připojování...';
            
            // Initialize socket client
            this.socketClient = new SocketClient();
            this.setupSocketEventHandlers();
            
            // Connect to server
            await this.socketClient.connect();
            
            // Register client
            this.socketClient.register(clientName);
            this.socketClient.socket.emit('get_shared_folders');
            
            // Initialize WebRTC client
            this.webrtcClient = new WebRTCClient(this.socketClient);
            this.setupWebRTCEventHandlers();
            
            this.isConnected = true;
            this.setConnectionStatus('online', 'Připojeno');
            this.showDashboard();
            this.showNotification('Úspěšně připojeno k síti', 'success');
            
        } catch (error) {
            console.error('Connection error:', error);
            this.setConnectionStatus('offline', 'Chyba připojení');
            this.showNotification('Nepodařilo se připojit k serveru', 'error');
            this.connectBtn.disabled = false;
            this.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Připojit se';
        }
    }
    
    disconnect() {
        if (this.webrtcClient) {
            this.webrtcClient.cleanup();
            this.webrtcClient = null;
        }
        
        if (this.socketClient) {
            this.socketClient.disconnect();
            this.socketClient = null;
        }
        
        this.isConnected = false;
        this.connectedPeers.clear();
        this.pingResults.clear();
        
        this.setConnectionStatus('offline', 'Odpojeno');
        this.showConnectionSetup();
        this.showNotification('Odpojeno od sítě', 'info');
    }
    
    setupSocketEventHandlers() {
        this.socketClient.onConnected = (data) => {
            this.updateClientInfo(data.clientId, this.clientNameInput.value);
        };
        
        this.socketClient.onDisconnected = (reason) => {
            this.setConnectionStatus('offline', 'Odpojeno');
            this.showNotification('Spojení se serverem bylo ztraceno', 'error');
        };
        
        this.socketClient.onPeerListUpdated = (peers) => {
            this.updatePeerList(peers);
        };
        
        this.socketClient.onConnectionRequest = (data) => {
            this.showConnectionRequest(data);
        };
        
        this.socketClient.onConnectionAccepted = (data) => {
            this.showNotification(`${data.fromName} přijal připojení`, 'success');
        };
        
        this.socketClient.onConnectionRejected = (data) => {
            this.showNotification(`${data.fromName} odmítl připojení`, 'warning');
        };
        
        this.socketClient.onError = (error) => {
            this.showNotification(`Chyba: ${error.error}`, 'error');
        };

        this.socketClient.onServiceAdded = (data) => {
            this.showNotification(`Služba "${data.service.name}" byla úspěšně přidána.`, 'success');
            this.toggleServiceForm(false);
        };

        this.socketClient.onServiceError = (data) => {
            this.showNotification(`Chyba při přidávání služby: ${data.error}`, 'error');
        };

        this.socketClient.onSharedFolderCreated = (data) => {
            this.showNotification(`Složka "${data.folderName}" byla úspěšně vytvořena.`, 'success');
            // Optionally, refresh a list of shared folders here
        };

        this.socketClient.onFolderError = (data) => {
            this.showNotification(`Chyba při vytváření složky: ${data.error}`, 'error');
        };

        this.socketClient.onSharedFolderList = (data) => {
            this.updateSharedFoldersList(data.folders);
        };

        this.socketClient.socket.on('folder_contents', (data) => {
            this.displayFolderContents(data.folderName, data.contents);
        });
    }
    
    setupWebRTCEventHandlers() {
        this.webrtcClient.setClientInfo(
            this.socketClient.clientId,
            this.socketClient.clientName
        );
        
        this.webrtcClient.onPeerConnected = (peerId) => {
            this.connectedPeers.add(peerId);
            this.updateConnectionsList();
            const peer = this.socketClient.getPeer(peerId);
            this.showNotification(`Připojeno k ${peer ? peer.name : peerId}`, 'success');
        };
        
        this.webrtcClient.onPeerDisconnected = (peerId) => {
            this.connectedPeers.delete(peerId);
            this.updateConnectionsList();
            const peer = this.socketClient.getPeer(peerId);
            this.showNotification(`Odpojeno od ${peer ? peer.name : peerId}`, 'info');
        };
        
        this.webrtcClient.onDataReceived = (peerId, data) => {
            this.handleDataReceived(peerId, data);
        };
        
        this.webrtcClient.onConnectionStateChange = (peerId, state) => {
            console.log(`Connection state with ${peerId}: ${state}`);
        };
    }
    
    setConnectionStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }
    
    showConnectionSetup() {
        this.connectionSetup.style.display = 'block';
        this.dashboard.style.display = 'none';
        this.connectBtn.disabled = false;
        this.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Připojit se';
    }
    
    showDashboard() {
        this.connectionSetup.style.display = 'none';
        this.dashboard.style.display = 'block';
    }
    
    updateClientInfo(clientId, clientName) {
        this.clientIdDisplay.textContent = clientId.substring(0, 8) + '...';
        this.clientNameDisplay.textContent = clientName;
    }
    
    updatePeerList(peers) {
        if (peers.length === 0) {
            this.peerList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-desktop"></i>
                    <p>Žádné další počítače nejsou online</p>
                </div>
            `;
            return;
        }
        
        this.peerList.innerHTML = peers.map(peer => `
            <div class="peer-item" data-peer-id="${peer.id}">
                <div class="peer-info">
                    <div class="peer-avatar">
                        ${peer.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="peer-details">
                    <div class="peer-name">${peer.name}</div>
                    <div class="peer-status status-${peer.status}">${this.getStatusText(peer.status)}</div>
                </div>
            </div>
            <div class="peer-services">
                ${this.getServicesHTML(peer.services)}
            </div>
            <div class="peer-actions">
                    ${this.getPeerActionButtons(peer)}
                </div>
            </div>
        `).join('');
        
        // Add event listeners to action buttons
        this.peerList.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const peerId = e.target.closest('.peer-item').dataset.peerId;
                this.handlePeerAction(action, peerId);
            });
        });
    }

    toggleServiceForm(show) {
        if (show) {
            this.addServiceForm.style.display = 'block';
        } else {
            this.addServiceForm.style.display = 'none';
            // Optionally clear the form
            document.getElementById('serviceName').value = '';
            document.getElementById('serviceUrl').value = '';
            document.getElementById('servicePorts').value = '';
            document.getElementById('serviceToken').value = '';
        }
    }

    saveService() {
        const serviceName = document.getElementById('serviceName').value.trim();
        const serviceUrl = document.getElementById('serviceUrl').value.trim();
        const servicePorts = document.getElementById('servicePorts').value.trim();
        const serviceToken = document.getElementById('serviceToken').value.trim();

        if (!serviceName || !serviceUrl) {
            this.showNotification('Název služby a URL jsou povinné.', 'error');
            return;
        }

        this.socketClient.socket.emit('add_service', { 
            serviceName, 
            serviceUrl, 
            servicePorts, 
            serviceToken 
        });
    }

    handleDisk() {
        const folderName = prompt('Zadejte název nové sdílené složky:');
        if (folderName && folderName.trim() !== '') {
            const folderSize = prompt('Zadejte velikost sdílené složky v MB:', '1024');
            if (folderSize && folderSize.trim() !== '') {
                this.socketClient.socket.emit('create_shared_folder', {
                    folderName: folderName.trim(),
                    folderSize: parseInt(folderSize.trim(), 10)
                });
            } else if (folderSize !== null) {
                this.showNotification('Velikost složky nemůže být prázdná.', 'error');
            }
        } else if (folderName !== null) { // prompt was not cancelled
            this.showNotification('Název složky nemůže být prázdný.', 'error');
        }
    }
    
    getPeerActionButtons(peer) {
        if (this.connectedPeers.has(peer.id)) {
            return `
                <button class="btn btn-secondary btn-small" data-action="ping">
                    <i class="fas fa-satellite-dish"></i> Ping
                </button>
                <button class="btn btn-danger btn-small" data-action="disconnect">
                    <i class="fas fa-unlink"></i> Odpojit
                </button>
            `;
        } else if (peer.status === 'connecting') {
            return `
                <button class="btn btn-secondary btn-small" disabled>
                    <i class="fas fa-spinner fa-spin"></i> Připojování...
                </button>
            `;
        } else {
            return `
                <button class="btn btn-primary btn-small" data-action="connect">
                    <i class="fas fa-link"></i> Připojit
                </button>
            `;
        }
    }
    
    getStatusText(status) {
        const statusMap = {
            'online': 'Online',
            'connecting': 'Připojování',
            'connected': 'Připojeno'
        };
        return statusMap[status] || status;
    }
    
    handlePeerAction(action, peerId) {
        switch (action) {
            case 'connect':
                this.connectToPeer(peerId);
                break;
            case 'disconnect':
                this.disconnectFromPeer(peerId);
                break;
            case 'ping':
                this.pingPeer(peerId);
                break;
        }
    }
    
    connectToPeer(peerId) {
        if (!this.socketClient || !this.webrtcClient) return;
        
        try {
            this.socketClient.requestConnection(peerId);
            const peer = this.socketClient.getPeer(peerId);
            this.showNotification(`Požadavek na připojení odeslán: ${peer ? peer.name : peerId}`, 'info');
        } catch (error) {
            console.error('Error connecting to peer:', error);
            this.showNotification('Chyba při připojování', 'error');
        }
    }
    
    disconnectFromPeer(peerId) {
        if (!this.webrtcClient) return;
        
        this.webrtcClient.disconnectFromPeer(peerId);
    }
    
    pingPeer(peerId) {
        if (!this.webrtcClient) return;
        
        const startTime = Date.now();
        const success = this.webrtcClient.pingPeer(peerId);
        
        if (success) {
            this.showNotification('Ping odeslán', 'info');
        } else {
            this.showNotification('Ping se nezdařil', 'error');
        }
    }
    
    updateConnectionsList() {
        if (this.connectedPeers.size === 0) {
            this.connectionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-unlink"></i>
                    <p>Žádná aktivní připojení</p>
                </div>
            `;
            return;
        }
        
        const connections = Array.from(this.connectedPeers).map(peerId => {
            const peer = this.socketClient.getPeer(peerId);
            const pingResult = this.pingResults.get(peerId);
            
            return `
                <div class="connection-item" data-peer-id="${peerId}">
                    <div class="connection-info">
                        <div class="connection-avatar">
                            ${peer ? peer.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div class="connection-details">
                            <div class="connection-name">${peer ? peer.name : peerId}</div>
                            <div class="connection-status">
                                ${pingResult ? `Ping: ${pingResult}ms` : 'Připojeno'}
                            </div>
                        </div>
                    </div>
                    <div class="connection-actions">
                        <button class="btn btn-secondary btn-small" data-action="ping">
                            <i class="fas fa-satellite-dish"></i>
                        </button>
                        <button class="btn btn-danger btn-small" data-action="disconnect">
                            <i class="fas fa-unlink"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.connectionsList.innerHTML = connections;
        
        // Add event listeners
        this.connectionsList.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const peerId = e.target.closest('.connection-item').dataset.peerId;
                this.handlePeerAction(action, peerId);
            });
        });
    }
    
    showConnectionRequest(data) {
        this.currentConnectionRequest = data;
        this.connectionRequestText.textContent = 
            `Počítač "${data.fromName}" chce se připojit k vašemu počítači.`;
        this.connectionRequestModal.classList.add('show');
    }
    
    acceptConnection() {
        if (this.currentConnectionRequest && this.socketClient) {
            this.socketClient.respondToConnection(this.currentConnectionRequest.fromId, true);
            this.hideConnectionRequest();
            this.showNotification('Připojení přijato', 'success');
        }
    }
    
    rejectConnection() {
        if (this.currentConnectionRequest && this.socketClient) {
            this.socketClient.respondToConnection(this.currentConnectionRequest.fromId, false);
            this.hideConnectionRequest();
            this.showNotification('Připojení odmítnuto', 'info');
        }
    }
    
    hideConnectionRequest() {
        this.connectionRequestModal.classList.remove('show');
        this.currentConnectionRequest = null;
    }
    
    refreshPeerList() {
        if (this.socketClient) {
            this.socketClient.requestPeerList();
            this.showNotification('Seznam obnovován...', 'info');
        }
    }
    
    pingAllPeers() {
        if (this.connectedPeers.size === 0) {
            this.showNotification('Žádná aktivní připojení', 'warning');
            return;
        }
        
        this.connectedPeers.forEach(peerId => {
            this.pingPeer(peerId);
        });
    }
    
    disconnectAllPeers() {
        if (this.connectedPeers.size === 0) {
            this.showNotification('Žádná aktivní připojení', 'warning');
            return;
        }
        
        const count = this.connectedPeers.size;
        this.connectedPeers.forEach(peerId => {
            this.disconnectFromPeer(peerId);
        });
        
        this.showNotification(`Odpojeno ${count} připojení`, 'info');
    }
    
    showStatistics() {
        const stats = this.generateStatistics();
        this.statisticsContent.innerHTML = stats;
        this.statisticsModal.classList.add('show');
    }
    
    hideStatistics() {
        this.statisticsModal.classList.remove('show');
    }
    
    generateStatistics() {
        const totalPeers = this.socketClient ? this.socketClient.getAllPeers().length : 0;
        const connectedPeers = this.connectedPeers.size;
        const avgPing = this.calculateAveragePing();
        
        return `
            <div class="stat-item">
                <div class="stat-value">${totalPeers}</div>
                <div class="stat-label">Online počítače</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${connectedPeers}</div>
                <div class="stat-label">Aktivní připojení</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${avgPing}ms</div>
                <div class="stat-label">Průměrný ping</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.isConnected ? 'Ano' : 'Ne'}</div>
                <div class="stat-label">Připojeno k síti</div>
            </div>
        `;
    }
    
    calculateAveragePing() {
        if (this.pingResults.size === 0) return 0;
        
        const total = Array.from(this.pingResults.values()).reduce((sum, ping) => sum + ping, 0);
        return Math.round(total / this.pingResults.size);
    }
    
    handleDataReceived(peerId, data) {
        if (data.type === 'pong') {
            const latency = Date.now() - data.originalTimestamp;
            this.pingResults.set(peerId, latency);
            this.updateConnectionsList();
            
            const peer = this.socketClient.getPeer(peerId);
            this.showNotification(`Ping ${peer ? peer.name : peerId}: ${latency}ms`, 'info');
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.notifications.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Remove on click
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new LANOverInternetApp();
});


function updateSharedFoldersList(folders) {
    sharedFoldersList.innerHTML = '';

    if (folders.length === 0) {
        sharedFoldersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder"></i>
                <p>Žádné sdílené složky</p>
            </div>
        `;
        return;
    }

    folders.forEach(folder => {
        const folderElement = document.createElement('div');
        folderElement.classList.add('shared-folder-item');
        folderElement.innerHTML = `
            <div class="folder-info">
                <i class="fas fa-folder"></i>
                <span class="folder-name">${folder.name}</span>
                <span class="folder-size">(${folder.size})</span>
            </div>
            <div class="folder-actions">
                <button class="btn btn-danger btn-small delete-folder-btn" data-folder="${folder.name}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        sharedFoldersList.appendChild(folderElement);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-folder-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const folderName = e.currentTarget.dataset.folder;
            if (confirm(`Opravdu si přejete smazat sdílenou složku "${folderName}"?`)) {
                socket.emit('delete_shared_folder', { folder_name: folderName });
            }
        });
    });
}

