# LAN-over-Internet Aplikace

Webová aplikace pro vytváření virtuálních LAN připojení přes internet mezi počítači pomocí WebRTC technologie.

## Funkce

- **Virtuální LAN síť**: Vytváření P2P připojení mezi počítači přes internet
- **Real-time komunikace**: WebSocket signaling pro okamžité aktualizace
- **Moderní UI**: Responzivní webové rozhraní s tmavým tématem
- **Síťové nástroje**: Ping, statistiky, správa připojení
- **NAT Traversal**: Automatické překonávání firewall a NAT omezení

## Technologie

### Backend
- **Flask** - webový framework
- **Flask-SocketIO** - WebSocket podpora
- **Python 3.11** - programovací jazyk

### Frontend
- **HTML5/CSS3** - struktura a styling
- **JavaScript ES6+** - logika aplikace
- **WebRTC API** - P2P komunikace
- **Socket.IO** - real-time komunikace

### Síťové technologie
- **WebRTC** - peer-to-peer komunikace
- **STUN servery** - NAT traversal
- **ICE** - connectivity establishment

## Instalace a spuštění

### Požadavky
- Python 3.11+
- Moderní webový prohlížeč s WebRTC podporou

### Kroky instalace

1. **Klonování projektu**
   ```bash
   git clone <repository-url>
   cd lan-over-internet
   ```

2. **Aktivace virtuálního prostředí**
   ```bash
   source venv/bin/activate
   ```

3. **Instalace závislostí**
   ```bash
   pip install -r requirements.txt
   ```

4. **Spuštění serveru**
   ```bash
   python src/main.py
   ```

5. **Otevření aplikace**
   - Otevřete webový prohlížeč
   - Přejděte na `http://localhost:5001`

## Použití

### Připojení k síti

1. **Zadání názvu počítače**
   - Zadejte název vašeho počítače do pole "Název počítače"
   - Klikněte na tlačítko "Připojit se"

2. **Dashboard**
   - Po úspěšném připojení se zobrazí dashboard
   - Vidíte informace o vašem klientovi
   - Seznam online počítačů
   - Aktivní připojení

### Připojení k jinému počítači

1. **Výběr počítače**
   - V sekci "Online počítače" vyberte počítač
   - Klikněte na tlačítko "Připojit"

2. **Potvrzení připojení**
   - Druhý počítač obdrží požadavek na připojení
   - Může připojení přijmout nebo odmítnout

3. **P2P komunikace**
   - Po přijetí se ustanoví přímé WebRTC spojení
   - Připojení se zobrazí v sekci "Aktivní připojení"

### Síťové nástroje

- **Ping všechny**: Otestuje latenci ke všem připojeným počítačům
- **Statistiky**: Zobrazí síťové statistiky a informace
- **Odpojit vše**: Odpojí všechna aktivní připojení

## Architektura

### Signaling Server
- Koordinuje připojení mezi klienty
- Spravuje WebRTC signaling zprávy
- Udržuje seznam online klientů
- Poskytuje real-time notifikace

### WebRTC Client
- Ustanovuje P2P spojení
- Spravuje data channels
- Implementuje NAT traversal
- Simuluje síťovou komunikaci

### Web UI
- Responzivní design
- Real-time aktualizace
- Intuitivní ovládání
- Moderní vzhled

## Omezení

1. **Webové prostředí**: Aplikace běží v prohlížeči, nemůže vytvořit skutečné síťové rozhraní na OS úrovni
2. **Simulace LAN**: Simuluje LAN komunikaci na aplikační úrovni
3. **NAT typy**: Některé typy NAT mohou vyžadovat TURN server
4. **Browser podpora**: Závislost na WebRTC podpoře v prohlížeči

## Bezpečnost

- **End-to-end šifrování**: WebRTC poskytuje automatické šifrování
- **Firewall friendly**: Používá standardní webové porty
- **Minimální data**: Server ukládá minimum dat o klientech
- **Peer autentifikace**: Jednoduchá autentifikace pomocí client ID

## Vývoj

### Struktura projektu
```
lan-over-internet/
├── src/
│   ├── main.py              # Hlavní Flask aplikace
│   └── static/
│       ├── index.html       # Hlavní HTML stránka
│       ├── styles.css       # CSS styly
│       ├── app.js          # Hlavní aplikační logika
│       ├── socket-client.js # Socket.IO klient
│       └── webrtc-client.js # WebRTC klient
├── venv/                    # Virtuální prostředí
└── requirements.txt         # Python závislosti
```

### API Endpoints

#### WebSocket Events

**Klient → Server:**
- `register` - Registrace klienta
- `get_peer_list` - Požadavek na seznam peers
- `connect_request` - Požadavek na připojení
- `connection_response` - Odpověď na požadavek
- `webrtc_offer` - WebRTC offer
- `webrtc_answer` - WebRTC answer
- `webrtc_ice_candidate` - ICE kandidát
- `connection_established` - Potvrzení spojení
- `disconnect_peer` - Odpojení od peer

**Server → Klient:**
- `connected` - Potvrzení připojení
- `registration_confirmed` - Potvrzení registrace
- `peer_list` - Seznam online peers
- `connection_request` - Požadavek na připojení
- `connection_accepted` - Přijetí připojení
- `connection_rejected` - Odmítnutí připojení
- `webrtc_offer` - WebRTC offer
- `webrtc_answer` - WebRTC answer
- `webrtc_ice_candidate` - ICE kandidát
- `peer_connected` - Peer připojen
- `peer_disconnected` - Peer odpojen

#### HTTP Endpoints
- `GET /` - Hlavní aplikace
- `GET /api/health` - Health check


