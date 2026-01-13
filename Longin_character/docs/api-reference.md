# API Reference Candy AI Clone

## Obsah
1. Základní informace
2. Autentizace
3. Endpointy - Characters
4. Endpointy - Chat
5. Endpointy - Memory
6. Endpointy - Voice
7. Endpointy - Models
8. Endpointy - Achievements
9. Endpointy - Story Engine
10. WebSocket API
11. Chybové kódy
12. Limity a omezení

## 1. Základní informace

Base URL: `http://localhost:3000/api`

Formát odpovědí: JSON

Všechny požadavky by měly obsahovat hlavičku:
```
Content-Type: application/json
```

## 2. Autentizace

API používá token-based autentizaci. Token získáte přihlášením:

### Login
```
POST /auth/login
```

Request body:
```json
{
  "username": "user",
  "password": "password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "user"
  }
}
```

Pro autentizované požadavky použijte hlavičku:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Endpointy - Characters

### Získání všech postav
```
GET /characters
```

Response:
```json
{
  "characters": [
    {
      "id": "1",
      "name": "Sakura",
      "avatar": "/uploads/sakura_avatar.jpg",
      "description": "Friendly AI assistant",
      "personality_traits": ["helpful", "friendly", "creative"],
      "created_at": "2023-06-15T14:30:00Z"
    },
    {
      "id": "2",
      "name": "Raven",
      "avatar": "/uploads/raven_avatar.jpg",
      "description": "Mysterious character",
      "personality_traits": ["mysterious", "intelligent", "sarcastic"],
      "created_at": "2023-06-16T10:15:00Z"
    }
  ]
}
```

### Získání konkrétní postavy
```
GET /characters/:id
```

Response:
```json
{
  "id": "1",
  "name": "Sakura",
  "avatar": "/uploads/sakura_avatar.jpg",
  "description": "Friendly AI assistant",
  "personality_traits": ["helpful", "friendly", "creative"],
  "created_at": "2023-06-15T14:30:00Z",
  "system_prompt": "You are Sakura, a friendly AI assistant...",
  "voice_id": "female_voice_1"
}
```

### Vytvoření postavy
```
POST /characters
```

Request body:
```json
{
  "name": "Nova",
  "description": "Sci-fi character with futuristic knowledge",
  "personality_traits": ["futuristic", "intelligent", "curious"],
  "system_prompt": "You are Nova, a character from the future...",
  "voice_id": "female_voice_2"
}
```

Response:
```json
{
  "id": "3",
  "name": "Nova",
  "avatar": "/default/avatar.jpg",
  "description": "Sci-fi character with futuristic knowledge",
  "personality_traits": ["futuristic", "intelligent", "curious"],
  "created_at": "2023-06-17T09:45:00Z",
  "system_prompt": "You are Nova, a character from the future...",
  "voice_id": "female_voice_2"
}
```

### Aktualizace postavy
```
PUT /characters/:id
```

Request body:
```json
{
  "name": "Nova Prime",
  "description": "Updated description",
  "personality_traits": ["futuristic", "intelligent", "helpful"]
}
```

Response:
```json
{
  "id": "3",
  "name": "Nova Prime",
  "avatar": "/default/avatar.jpg",
  "description": "Updated description",
  "personality_traits": ["futuristic", "intelligent", "helpful"],
  "created_at": "2023-06-17T09:45:00Z",
  "updated_at": "2023-06-17T10:30:00Z",
  "system_prompt": "You are Nova, a character from the future...",
  "voice_id": "female_voice_2"
}
```

### Smazání postavy
```
DELETE /characters/:id
```

Response:
```json
{
  "success": true,
  "message": "Character deleted successfully"
}
```

### Nahrání avataru
```
POST /characters/:id/avatar
```

Používá multipart/form-data s polem `avatar`.

Response:
```json
{
  "success": true,
  "avatar_url": "/uploads/nova_avatar_12345.jpg"
}
```

### Export postavy
```
GET /characters/:id/export
```

Response (JSON soubor ke stažení):
```json
{
  "name": "Nova Prime",
  "description": "Updated description",
  "personality_traits": ["futuristic", "intelligent", "helpful"],
  "system_prompt": "You are Nova, a character from the future...",
  "voice_id": "female_voice_2",
  "schema_version": "1.0"
}
```

### Import postavy
```
POST /characters/import
```

Používá multipart/form-data s polem `character_file`.

Response:
```json
{
  "id": "4",
  "name": "Imported Character",
  "success": true,
  "message": "Character imported successfully"
}
```

## 4. Endpointy - Chat

### Získání konverzací
```
GET /chat/conversations
```

Response:
```json
{
  "conversations": [
    {
      "id": "conv_1",
      "character_id": "1",
      "title": "First conversation",
      "created_at": "2023-06-15T15:30:00Z",
      "updated_at": "2023-06-15T16:45:00Z",
      "message_count": 10
    },
    {
      "id": "conv_2",
      "character_id": "2",
      "title": "Another chat",
      "created_at": "2023-06-16T12:30:00Z",
      "updated_at": "2023-06-16T13:15:00Z",
      "message_count": 5
    }
  ]
}
```

### Získání zpráv konverzace
```
GET /chat/conversations/:id/messages
```

Response:
```json
{
  "conversation_id": "conv_1",
  "character": {
    "id": "1",
    "name": "Sakura",
    "avatar": "/uploads/sakura_avatar.jpg"
  },
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hello Sakura!",
      "timestamp": "2023-06-15T15:30:10Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "Hi there! How can I help you today?",
      "timestamp": "2023-06-15T15:30:15Z"
    }
  ]
}
```

### Vytvoření nové konverzace
```
POST /chat/conversations
```

Request body:
```json
{
  "character_id": "1",
  "title": "New conversation"
}
```

Response:
```json
{
  "id": "conv_3",
  "character_id": "1",
  "title": "New conversation",
  "created_at": "2023-06-17T11:00:00Z",
  "updated_at": "2023-06-17T11:00:00Z",
  "message_count": 0
}
```

### Odeslání zprávy
```
POST /chat/conversations/:id/messages
```

Request body:
```json
{
  "content": "Tell me a story about space exploration",
  "role": "user"
}
```

Response:
```json
{
  "id": "msg_10",
  "conversation_id": "conv_3",
  "role": "user",
  "content": "Tell me a story about space exploration",
  "timestamp": "2023-06-17T11:05:00Z"
}
```

### Získání odpovědi od AI
```
POST /chat/generate
```

Request body:
```json
{
  "conversation_id": "conv_3",
  "model": "dolphin-mistral"
}
```

Response:
```json
{
  "id": "msg_11",
  "conversation_id": "conv_3",
  "role": "assistant",
  "content": "In the year 2157, humanity had finally mastered faster-than-light travel...",
  "timestamp": "2023-06-17T11:05:10Z"
}
```

### Streamovaná odpověď od AI
```
POST /chat/generate/stream
```

Toto endpoint používá Server-Sent Events (SSE) pro streamování odpovědi.

Request body:
```json
{
  "conversation_id": "conv_3",
  "model": "dolphin-mistral"
}
```

Response stream:
```
event: message
data: {"content": "In the ", "done": false}

event: message
data: {"content": "year ", "done": false}

event: message
data: {"content": "2157, ", "done": false}

...

event: message
data: {"content": "", "done": true, "message_id": "msg_11"}
```

## 5. Endpointy - Memory

### Získání vzpomínek postavy
```
GET /memory/:character_id
```

Response:
```json
{
  "character_id": "1",
  "memories": [
    {
      "id": "mem_1",
      "text": "User mentioned they have a dog named Max",
      "importance": 0.8,
      "created_at": "2023-06-15T16:30:00Z"
    },
    {
      "id": "mem_2",
      "text": "User is interested in space exploration",
      "importance": 0.6,
      "created_at": "2023-06-17T11:10:00Z"
    }
  ]
}
```

### Přidání vzpomínky
```
POST /memory/:character_id
```

Request body:
```json
{
  "text": "User mentioned they work as a software developer",
  "importance": 0.7
}
```

Response:
```json
{
  "id": "mem_3",
  "character_id": "1",
  "text": "User mentioned they work as a software developer",
  "importance": 0.7,
  "created_at": "2023-06-17T14:20:00Z"
}
```

### Získání relevantních vzpomínek
```
POST /memory/:character_id/relevant
```

Request body:
```json
{
  "query": "What does the user do for work?",
  "limit": 5
}
```

Response:
```json
{
  "character_id": "1",
  "query": "What does the user do for work?",
  "memories": [
    {
      "id": "mem_3",
      "text": "User mentioned they work as a software developer",
      "importance": 0.7,
      "created_at": "2023-06-17T14:20:00Z",
      "relevance_score": 0.92
    }
  ]
}
```

## 6. Endpointy - Voice

### Generování hlasového výstupu
```
POST /voice/generate
```

Request body:
```json
{
  "text": "Hello, how are you today?",
  "voice_id": "female_voice_1"
}
```

Response:
```json
{
  "audio_url": "/api/voice/audio/tts_output_12345.mp3",
  "duration": 2.5,
  "voice_id": "female_voice_1"
}
```

### Získání dostupných hlasů
```
GET /voice/voices
```

Response:
```json
{
  "voices": [
    {
      "id": "female_voice_1",
      "name": "Sakura",
      "gender": "female",
      "language": "en"
    },
    {
      "id": "male_voice_1",
      "name": "Alex",
      "gender": "male",
      "language": "en"
    }
  ]
}
```

## 7. Endpointy - Models

### Získání dostupných modelů
```
GET /models
```

Response:
```json
{
  "models": [
    {
      "id": "dolphin-mistral",
      "name": "Dolphin-Mistral",
      "description": "Powerful and efficient language model",
      "context_length": 8192,
      "params": "7B",
      "status": "ready"
    },
    {
      "id": "wizardlm-uncensored",
      "name": "WizardLM-Uncensored",
      "description": "Uncensored creative model for role-playing",
      "context_length": 4096,
      "params": "13B",
      "status": "ready"
    }
  ]
}
```

### Přepnutí aktivního modelu
```
POST /models/active
```

Request body:
```json
{
  "model_id": "wizardlm-uncensored"
}
```

Response:
```json
{
  "success": true,
  "active_model": {
    "id": "wizardlm-uncensored",
    "name": "WizardLM-Uncensored",
    "description": "Uncensored creative model for role-playing",
    "context_length": 4096,
    "params": "13B",
    "status": "ready"
  }
}
```

### Stav stahování modelu
```
GET /models/:model_id/status
```

Response:
```json
{
  "model_id": "llama3-uncensored",
  "status": "downloading",
  "progress": 45,
  "eta_seconds": 120
}
```

### Zahájení stahování modelu
```
POST /models/download
```

Request body:
```json
{
  "model_id": "llama3-uncensored"
}
```

Response:
```json
{
  "success": true,
  "model_id": "llama3-uncensored",
  "status": "downloading",
  "progress": 0
}
```

## 8. Endpointy - Achievements

### Získání všech achievementů
```
GET /achievements
```

Response:
```json
{
  "achievements": [
    {
      "id": "first_chat",
      "name": "First Contact",
      "description": "Start your first conversation",
      "icon": "/assets/achievements/first_chat.png",
      "unlocked": true,
      "unlocked_at": "2023-06-15T15:30:00Z"
    },
    {
      "id": "character_creator",
      "name": "Character Creator",
      "description": "Create your first custom character",
      "icon": "/assets/achievements/character_creator.png",
      "unlocked": false,
      "progress": 0,
      "total": 1
    }
  ]
}
```

### Získání konkrétního achievementu
```
GET /achievements/:id
```

Response:
```json
{
  "id": "conversation_master",
  "name": "Conversation Master",
  "description": "Have 100 messages in a single conversation",
  "icon": "/assets/achievements/conversation_master.png",
  "unlocked": false,
  "progress": 45,
  "total": 100
}
```

### Získání nedávno odemknutých achievementů
```
GET /achievements/recent
```

Response:
```json
{
  "recent_achievements": [
    {
      "id": "story_explorer",
      "name": "Story Explorer",
      "description": "Complete your first story branch",
      "icon": "/assets/achievements/story_explorer.png",
      "unlocked_at": "2023-06-17T13:45:00Z"
    }
  ]
}
```

## 9. Endpointy - Story Engine

### Získání dostupných příběhů
```
GET /stories
```

Response:
```json
{
  "stories": [
    {
      "id": "space_adventure",
      "title": "Space Adventure",
      "description": "Explore the universe with your AI companion",
      "character_id": "3",
      "thumbnail": "/assets/stories/space_adventure.jpg",
      "completion_rate": 0,
      "created_at": "2023-06-16T10:00:00Z"
    }
  ]
}
```

### Zahájení příběhu
```
POST /stories/:id/start
```

Response:
```json
{
  "story_id": "space_adventure",
  "session_id": "story_session_1",
  "current_node": {
    "id": "node_1",
    "text": "You wake up aboard a spaceship, disoriented. The AI assistant Nova looks at you with concern. 'Are you alright?' she asks.",
    "choices": [
      {
        "id": "choice_1",
        "text": "Ask where you are"
      },
      {
        "id": "choice_2",
        "text": "Try to remember what happened"
      }
    ]
  }
}
```

### Výběr volby v příběhu
```
POST /stories/session/:session_id/choice
```

Request body:
```json
{
  "choice_id": "choice_1"
}
```

Response:
```json
{
  "session_id": "story_session_1",
  "current_node": {
    "id": "node_2",
    "text": "'You're aboard the Stellar Explorer,' Nova explains. 'We're on a mission to investigate a mysterious signal from Alpha Centauri. Don't you remember?'",
    "choices": [
      {
        "id": "choice_3",
        "text": "Say you remember now"
      },
      {
        "id": "choice_4",
        "text": "Admit you don't remember anything"
      }
    ]
  }
}
```

### Uložení pokroku příběhu
```
POST /stories/session/:session_id/save
```

Response:
```json
{
  "success": true,
  "session_id": "story_session_1",
  "saved_at": "2023-06-17T14:30:00Z",
  "node_id": "node_2"
}
```

### Načtení uloženého příběhu
```
GET /stories/session/:session_id
```

Response:
```json
{
  "story_id": "space_adventure",
  "session_id": "story_session_1",
  "current_node": {
    "id": "node_2",
    "text": "'You're aboard the Stellar Explorer,' Nova explains. 'We're on a mission to investigate a mysterious signal from Alpha Centauri. Don't you remember?'",
    "choices": [
      {
        "id": "choice_3",
        "text": "Say you remember now"
      },
      {
        "id": "choice_4",
        "text": "Admit you don't remember anything"
      }
    ]
  },
  "progress": 15,
  "last_saved": "2023-06-17T14:30:00Z"
}
```

## 10. WebSocket API

WebSocket URL: `ws://localhost:3000/socket`

### Autentizace
Připojte se s parametrem tokenu:
```
ws://localhost:3000/socket?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Události (Events)

#### Připojení klienta
```json
// Server -> Client
{
  "type": "connected",
  "data": {
    "client_id": "client_12345"
  }
}
```

#### Chat zprávy
```json
// Client -> Server (odeslání zprávy)
{
  "type": "message",
  "data": {
    "conversation_id": "conv_3",
    "content": "Hello there!",
    "role": "user"
  }
}

// Server -> Client (potvrzení zprávy)
{
  "type": "message_ack",
  "data": {
    "message_id": "msg_20",
    "conversation_id": "conv_3",
    "timestamp": "2023-06-17T15:00:00Z"
  }
}

// Server -> Client (nová zpráva)
{
  "type": "new_message",
  "data": {
    "message": {
      "id": "msg_21",
      "conversation_id": "conv_3",
      "content": "Hi! How can I help you?",
      "role": "assistant",
      "timestamp": "2023-06-17T15:00:05Z"
    }
  }
}
```

#### Streamovaná odpověď
```json
// Client -> Server (požadavek na streamovanou odpověď)
{
  "type": "stream_request",
  "data": {
    "conversation_id": "conv_3",
    "model": "dolphin-mistral"
  }
}

// Server -> Client (stream token)
{
  "type": "stream_token",
  "data": {
    "conversation_id": "conv_3",
    "token": "Hello",
    "done": false
  }
}

// Server -> Client (další token)
{
  "type": "stream_token",
  "data": {
    "conversation_id": "conv_3",
    "token": " there",
    "done": false
  }
}

// Server -> Client (konec streamu)
{
  "type": "stream_end",
  "data": {
    "conversation_id": "conv_3",
    "message_id": "msg_22",
    "timestamp": "2023-06-17T15:05:00Z"
  }
}
```

#### Notifikace dosažení achievementu
```json
// Server -> Client
{
  "type": "achievement_unlocked",
  "data": {
    "achievement": {
      "id": "conversation_master",
      "name": "Conversation Master",
      "description": "Have 100 messages in a single conversation",
      "icon": "/assets/achievements/conversation_master.png"
    }
  }
}
```

#### Aktualizace stavu modelu
```json
// Server -> Client
{
  "type": "model_update",
  "data": {
    "model_id": "llama3-uncensored",
    "status": "downloading",
    "progress": 75
  }
}
```

## 11. Chybové kódy

API používá standardní HTTP stavové kódy:

- `200 OK`: Požadavek byl úspěšný
- `201 Created`: Zdroj byl úspěšně vytvořen
- `400 Bad Request`: Neplatný požadavek
- `401 Unauthorized`: Chybějící nebo neplatná autentizace
- `403 Forbidden`: Přístup zakázán
- `404 Not Found`: Zdroj nebyl nalezen
- `429 Too Many Requests`: Překročení limitu požadavků
- `500 Internal Server Error`: Chyba serveru

Chybové odpovědi mají formát:
```json
{
  "error": {
    "code": "invalid_input",
    "message": "Invalid request parameters",
    "details": {
      "field": "name",
      "issue": "Name is required"
    }
  }
}
```

Běžné chybové kódy:
- `invalid_input`: Neplatný vstup
- `resource_not_found`: Zdroj nebyl nalezen
- `unauthorized`: Neautorizovaný přístup
- `rate_limited`: Překročení limitu požadavků
- `server_error`: Interní chyba serveru
- `model_not_ready`: AI model není připraven
- `stream_error`: Chyba streamování

## 12. Limity a omezení

- Maximální velikost požadavku: 10 MB
- Rate limiting: 60 požadavků za minutu
- Maximální délka textu pro generování: 4096 tokenů
- Maximální délka textu pro TTS: 1000 znaků
- Maximální velikost souboru pro upload: 5 MB
- Streamované odpovědi mají timeout po 60 sekundách
- WebSocket připojení mají timeout po 10 minutách neaktivity