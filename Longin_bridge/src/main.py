import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import uuid
import json
import requests
from datetime import datetime
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from dotenv import load_dotenv
import shutil

load_dotenv()

from mcp_server import app as mcp_app
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
PIN_CODE = os.getenv("PIN_CODE")

# Enable CORS for all routes
CORS(app, origins="*")

# Mount the MCP app
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
    '/mcp': mcp_app
})

# Initialize SocketIO with CORS support
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# In-memory storage for connected clients
connected_clients = {}
client_rooms = {}

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.route('/api/health')
def health_check():
    return {"status": "ok", "clients": len(connected_clients)}

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'status': 'connected', 'clientId': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    
    # Remove client from connected_clients
    if request.sid in connected_clients:
        client_info = connected_clients[request.sid]
        del connected_clients[request.sid]
        
        # Leave any rooms
        if request.sid in client_rooms:
            del client_rooms[request.sid]
        
        # Notify all clients about the disconnection
        broadcast_peer_list()

@socketio.on('add_service')
def handle_add_service(data):
    """Add a new service for a client"""
    client_id = request.sid
    if client_id not in connected_clients:
        emit('service_error', {'error': 'Client not found'})
        return

    service_name = data.get('serviceName')
    service_url = data.get('serviceUrl')
    service_ports = data.get('servicePorts')
    service_token = data.get('serviceToken')

    if not service_name or not service_url:
        emit('service_error', {'error': 'Service name and URL are required'})
        return

    new_service = {
        'id': str(uuid.uuid4()),
        'name': service_name,
        'url': service_url,
        'ports': service_ports,
        'token': service_token
    }

    connected_clients[client_id]['services'].append(new_service)

    # Notify the client that the service was added
    emit('service_added', {'service': new_service})

    # Broadcast the updated peer list to show the new service
    broadcast_peer_list()

@socketio.on('create_shared_folder')
def handle_create_shared_folder(data):
    """Create a shared folder accessible to all clients"""
    folder_name = data.get('folderName')
    folder_size = data.get('folderSize')

    if not folder_name:
        emit('folder_error', {'error': 'Folder name is required'})
        return

    print(f"Creating folder '{folder_name}' with size '{folder_size} MB'")

    try:
        shared_dir = os.path.join(os.path.dirname(__file__), 'shared')
        if not os.path.exists(shared_dir):
            os.makedirs(shared_dir)

        folder_path = os.path.join(shared_dir, folder_name)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

            # Store metadata
            metadata_path = os.path.join(folder_path, 'metadata.json')
            with open(metadata_path, 'w') as f:
                json.dump({'size': folder_size}, f)

            # Broadcast to all clients that a new folder is available
            socketio.emit('shared_folder_created', {'folderName': folder_name, 'path': folder_path, 'size': folder_size})

            # Also broadcast the updated list of all folders
            handle_get_shared_folders()
        else:
            emit('folder_error', {'error': 'Folder with this name already exists'})

    except Exception as e:
        print(f"Error creating shared folder: {e}")
        emit('folder_error', {'error': 'Could not create shared folder on the server'})

@socketio.on('delete_shared_folder')
def handle_delete_shared_folder(data):
    """Delete a shared folder."""
    folder_name = data.get('folderName')

    if not folder_name:
        emit('folder_error', {'error': 'Folder name is required'})
        return

    try:
        shared_dir = os.path.join(os.path.dirname(__file__), 'shared')
        folder_path = os.path.join(shared_dir, folder_name)

        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)
            print(f"Deleted folder: {folder_path}")
            handle_get_shared_folders()  # Broadcast updated list
        else:
            emit('folder_error', {'error': 'Folder not found'})

    except Exception as e:
        print(f"Error deleting folder: {e}")
        emit('folder_error', {'error': 'Could not delete shared folder'})


@socketio.on('list_folder_contents')
def handle_list_folder_contents(data):
    """Send the list of a shared folder's contents to the client"""
    folder_name = data.get('folderName')
    if not folder_name:
        emit('folder_content_error', {'error': 'Folder name is required'})
        return

    try:
        shared_dir = os.path.join(os.path.dirname(__file__), 'shared')
        folder_path = os.path.join(shared_dir, folder_name)
        
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            contents = []
            for item in os.listdir(folder_path):
                item_path = os.path.join(folder_path, item)
                if os.path.isdir(item_path):
                    contents.append({'name': item, 'type': 'directory'})
                else:
                    contents.append({'name': item, 'type': 'file'})
            
            emit('folder_contents', {'folderName': folder_name, 'contents': contents})
        else:
            emit('folder_content_error', {'error': 'Folder not found'})
            
    except Exception as e:
        print(f"Error listing folder contents: {e}")
        emit('folder_content_error', {'error': 'Could not retrieve folder contents'})


@socketio.on('get_shared_folders')
def handle_get_shared_folders():
    """Send the list of shared folders to the client"""
    try:
        shared_dir = os.path.join(os.path.dirname(__file__), 'shared')
        folders_list = []
        if os.path.exists(shared_dir):
            for folder_name in os.listdir(shared_dir):
                folder_path = os.path.join(shared_dir, folder_name)
                if os.path.isdir(folder_path):
                    metadata_path = os.path.join(folder_path, 'metadata.json')
                    size = None
                    if os.path.exists(metadata_path):
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                            size = metadata.get('size')
                    folders_list.append({'name': folder_name, 'size': size})
            emit('shared_folder_list', {'folders': folders_list})
        else:
            emit('shared_folder_list', {'folders': []})
    except Exception as e:
        print(f"Error getting shared folders: {e}")
        emit('folder_error', {'error': 'Could not retrieve shared folders'})


@socketio.on('llm_chat_message')
def handle_llm_chat_message(data):
    """Handle incoming chat messages for the LLM chat."""
    client_id = request.sid
    if client_id not in connected_clients:
        emit('llm_chat_error', {'error': 'You are not registered.'})
        return

    message = data.get('message')
    if not message:
        emit('llm_chat_error', {'error': 'Message cannot be empty.'})
        return

    # Emit the user's message to all clients for display
    emit('new_llm_chat_message', {
        'from': 'user',
        'message': message,
        'timestamp': datetime.now().isoformat()
    }, broadcast=True)

    # Send the message to the local LLM
    try:
        llm_response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                "model": "llama2",
                "prompt": message,
                "stream": False
            }
        )
        llm_response.raise_for_status()
        
        response_data = llm_response.json()
        llm_full_response = response_data.get("response", "")

        # Once the full response is received, emit it
        emit('new_llm_chat_message', {
            'from': 'assistant',
            'message': llm_full_response,
            'timestamp': datetime.now().isoformat()
        }, broadcast=True)

    except requests.exceptions.RequestException as e:
        print(f"Error calling LLM: {e}")
        emit('llm_chat_error', {'error': 'Could not connect to the LLM.'})


@socketio.on('register')
def handle_register(data):
    """Register a new client with name and capabilities"""
    client_id = request.sid
    client_name = data.get('clientName', f'Client-{client_id[:8]}')
    pin = data.get('pin')

    if PIN_CODE and pin != PIN_CODE:
        emit('registration_failed', {'error': 'Invalid PIN'})
        return
    
    connected_clients[client_id] = {
        'id': client_id,
        'name': client_name,
        'status': 'online',
        'connected_at': datetime.now().isoformat(),
        'peer_connections': [],
        'services': []
    }
    
    print(f'Client registered: {client_name} ({client_id})')
    
    # Send confirmation to the registering client
    emit('registration_confirmed', {
        'clientId': client_id,
        'clientName': client_name
    })
    
    # Broadcast updated peer list to all clients
    broadcast_peer_list()

@socketio.on('get_peer_list')
def handle_get_peer_list():
    """Send current peer list to requesting client"""
    peer_list = []
    for client_id, client_info in connected_clients.items():
        peer_list.append({
            'id': client_id,
            'name': client_info['name'],
            'status': client_info['status']
        })
    
    emit('peer_list', {'peers': peer_list})

@socketio.on('connect_request')
def handle_connect_request(data):
    """Handle connection request to another peer"""
    target_id = data.get('targetId')
    
    if target_id not in connected_clients:
        emit('connection_error', {'error': 'Target client not found'})
        return
    
    # Update status
    if request.sid in connected_clients:
        connected_clients[request.sid]['status'] = 'connecting'
    
    # Forward connection request to target
    socketio.emit('connection_request', {
        'fromId': request.sid,
        'fromName': connected_clients[request.sid]['name']
    }, room=target_id)
    
    broadcast_peer_list()

@socketio.on('connection_response')
def handle_connection_response(data):
    """Handle response to connection request"""
    target_id = data.get('targetId')
    accepted = data.get('accepted', False)
    
    if target_id not in connected_clients:
        return
    
    if accepted:
        # Both clients are now in connecting state
        if target_id in connected_clients:
            connected_clients[target_id]['status'] = 'connecting'
        
        # Forward response to the original requester
        socketio.emit('connection_accepted', {
            'fromId': request.sid,
            'fromName': connected_clients[request.sid]['name']
        }, room=target_id)
    else:
        # Reset status on rejection
        if request.sid in connected_clients:
            connected_clients[request.sid]['status'] = 'online'
        if target_id in connected_clients:
            connected_clients[target_id]['status'] = 'online'
        
        # Forward rejection to the original requester
        socketio.emit('connection_rejected', {
            'fromId': request.sid,
            'fromName': connected_clients[request.sid]['name']
        }, room=target_id)
    
    broadcast_peer_list()

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    """Forward WebRTC offer to target peer"""
    target_id = data.get('targetId')
    offer = data.get('offer')
    
    if target_id not in connected_clients:
        emit('webrtc_error', {'error': 'Target client not found'})
        return
    
    socketio.emit('webrtc_offer', {
        'fromId': request.sid,
        'offer': offer
    }, room=target_id)

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    """Forward WebRTC answer to target peer"""
    target_id = data.get('targetId')
    answer = data.get('answer')
    
    if target_id not in connected_clients:
        emit('webrtc_error', {'error': 'Target client not found'})
        return
    
    socketio.emit('webrtc_answer', {
        'fromId': request.sid,
        'answer': answer
    }, room=target_id)

@socketio.on('webrtc_ice_candidate')
def handle_ice_candidate(data):
    """Forward ICE candidate to target peer"""
    target_id = data.get('targetId')
    candidate = data.get('candidate')
    
    if target_id not in connected_clients:
        return
    
    socketio.emit('webrtc_ice_candidate', {
        'fromId': request.sid,
        'candidate': candidate
    }, room=target_id)

@socketio.on('connection_established')
def handle_connection_established(data):
    """Handle successful P2P connection establishment"""
    target_id = data.get('targetId')
    
    if target_id not in connected_clients:
        return
    
    # Update both clients' status to connected
    if request.sid in connected_clients:
        connected_clients[request.sid]['status'] = 'connected'
        if target_id not in connected_clients[request.sid]['peer_connections']:
            connected_clients[request.sid]['peer_connections'].append(target_id)
    
    if target_id in connected_clients:
        connected_clients[target_id]['status'] = 'connected'
        if request.sid not in connected_clients[target_id]['peer_connections']:
            connected_clients[target_id]['peer_connections'].append(request.sid)
    
    # Notify both clients
    socketio.emit('peer_connected', {
        'peerId': request.sid,
        'peerName': connected_clients[request.sid]['name']
    }, room=target_id)
    
    emit('peer_connected', {
        'peerId': target_id,
        'peerName': connected_clients[target_id]['name']
    })
    
    broadcast_peer_list()

@socketio.on('disconnect_peer')
def handle_disconnect_peer(data):
    """Handle disconnection from a specific peer"""
    target_id = data.get('targetId')
    
    if target_id not in connected_clients:
        return
    
    # Remove from peer connections
    if request.sid in connected_clients:
        if target_id in connected_clients[request.sid]['peer_connections']:
            connected_clients[request.sid]['peer_connections'].remove(target_id)
        
        # Update status if no more connections
        if not connected_clients[request.sid]['peer_connections']:
            connected_clients[request.sid]['status'] = 'online'
    
    if target_id in connected_clients:
        if request.sid in connected_clients[target_id]['peer_connections']:
            connected_clients[target_id]['peer_connections'].remove(request.sid)
        
        # Update status if no more connections
        if not connected_clients[target_id]['peer_connections']:
            connected_clients[target_id]['status'] = 'online'
    
    # Notify both clients
    socketio.emit('peer_disconnected', {
        'peerId': request.sid,
        'peerName': connected_clients[request.sid]['name']
    }, room=target_id)
    
    emit('peer_disconnected', {
        'peerId': target_id,
        'peerName': connected_clients[target_id]['name']
    })
    
    broadcast_peer_list()

def broadcast_peer_list():
    """Broadcast updated peer list to all connected clients"""
    for client_id in connected_clients:
        peer_list = []
        for peer_id, peer_info in connected_clients.items():
            if peer_id != client_id:  # Don't include self
                peer_list.append({
                    'id': peer_id,
                    'name': peer_info['name'],
                    'status': peer_info['status'],
                    'services': peer_info.get('services', [])
                })
        
        socketio.emit('peer_list', {'peers': peer_list}, room=client_id)

if __name__ == '__main__':
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"Failed to start server: {e}")

