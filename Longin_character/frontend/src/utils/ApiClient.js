/**
 * API Client
 * 
 * Optimalizovaný klient pro komunikaci s backend API.
 * Podporuje cachování, retry mechanismus a sledování výkonu.
 */

import axios from 'axios';
import PerformanceMonitor from './PerformanceMonitor';
import io from 'socket.io-client';

// Konfigurace API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut v milisekundách
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 sekunda

// Událost pro uživatelské připojení
const EVENT_CONNECTED = 'user_connected';
// Událost pro chyby
const EVENT_ERROR = 'error';
// Událost pro nové zprávy
const EVENT_NEW_MESSAGE = 'receive_message';
// Událost pro začátek streamu
const EVENT_STREAM_START = 'stream_start';
// Událost pro aktualizaci streamu
const EVENT_STREAM_CHUNK = 'stream_chunk';
// Událost pro konec streamu
const EVENT_STREAM_END = 'stream_end';
// Událost pro připojení k místnosti (konverzaci)
const EVENT_JOIN_CONVERSATION = 'join_conversation';
// Událost pro opuštění místnosti (konverzace)
const EVENT_LEAVE_CONVERSATION = 'leave_conversation';
// Událost pro odeslání zprávy
const EVENT_SEND_MESSAGE = 'send_message';
// Událost pro psaní uživatele
const EVENT_TYPING = 'user_typing';
// Událost pro psaní postavy
const EVENT_AI_TYPING = 'ai_typing';
// Událost pro nové úspěchy
const EVENT_NEW_ACHIEVEMENTS = 'new_achievements';

class ApiClient {
  constructor() {
    // Vytvoření instance Axios s výchozí konfigurací
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000, // 30 sekund
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true // Povolení předávání cookies pro CORS
    });
    
    // Inicializace cache
    this.cache = new Map();
    
    // Nastavení interceptorů pro monitoring a retry
    this.setupInterceptors();
    
    // Uložení auth tokenu z localStorage
    this.loadAuthToken();
    
    // Socket.IO instance
    this.socket = null;
    
    // Flag pro připojený stav
    this.isConnected = false;
    
    // Handlers pro Socket.IO události
    this.eventHandlers = {
      [EVENT_NEW_MESSAGE]: [],
      [EVENT_STREAM_START]: [],
      [EVENT_STREAM_CHUNK]: [],
      [EVENT_STREAM_END]: [],
      [EVENT_ERROR]: [],
      [EVENT_TYPING]: [],
      [EVENT_AI_TYPING]: [],
      [EVENT_NEW_ACHIEVEMENTS]: []
    };
    
    // Vytvoření WebSocket spojení při inicializaci, pokud je uživatel přihlášen
    if (this.authToken) {
      this.initSocket();
    }
    
    // Naslouchání na události odhlášení pro odpojení socketu
    window.addEventListener('auth:logout', this.disconnectSocket.bind(this));
  }
  
  /**
   * Nastaví Axios interceptory pro monitoring a retry
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        // Sledování začátku API volání
        config.metadata = { 
          startTime: new Date(),
          retryCount: 0
        };
        
        // Přidání performance tracking
        config.perfTracker = PerformanceMonitor.trackApiCall(
          config.url,
          config.method
        );
        
        // Přidání auth tokenu, pokud existuje
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        // Sledování konce API volání
        if (response.config.perfTracker) {
          response.config.perfTracker.end(response.status);
        }
        
        return response;
      },
      async error => {
        // Sledování neúspěšného API volání
        if (error.config && error.config.perfTracker) {
          error.config.perfTracker.end(
            error.response ? error.response.status : 0
          );
        }
        
        // Retry logika pro selhané požadavky
        const originalRequest = error.config;
        
        // Zkontrolujeme, jestli jsme již nepřekročili počet retry pokusů
        if (originalRequest && 
            originalRequest.metadata && 
            originalRequest.metadata.retryCount < MAX_RETRIES && 
            (error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
          
          originalRequest.metadata.retryCount++;
          
          // Exponenciální backoff pro zpoždění
          const delay = RETRY_DELAY * Math.pow(2, originalRequest.metadata.retryCount - 1);
          
          // Počkáme před novým pokusem
          await new Promise(resolve => setTimeout(resolve, delay));
          
          console.log(`Retry attempt ${originalRequest.metadata.retryCount} for ${originalRequest.url}`);
          return this.client(originalRequest);
        }
        
        // Pokud je chyba 401 Unauthorized, zkusíme token refresh
        if (error.response && error.response.status === 401 && this.authToken) {
          try {
            // Pokusíme se refreshnout token
            const refreshed = await this.refreshToken();
            
            if (refreshed) {
              // Pokud se token obnovil, zkusíme původní požadavek znovu
              originalRequest.headers.Authorization = `Bearer ${this.authToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Pokud refresh selhal, provedeme logout
            this.logout();
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Načte auth token z localStorage
   */
  loadAuthToken() {
    this.authToken = localStorage.getItem('auth_token');
  }
  
  /**
   * Nastaví auth token pro API volání
   * @param {string} token - Auth token
   */
  setAuthToken(token) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
  
  /**
   * Inicializuje WebSocket spojení
   */
  initSocket() {
    // Odpojení existujícího socketu, pokud existuje
    this.disconnectSocket();
    
    try {
      // Vytvoření nového Socket.IO spojení
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        auth: {
          token: this.authToken
        },
        query: {
          token: this.authToken
        }
      });
      
      // Nastavení event handlerů
      this.socket.on('connect', () => {
        console.log('Socket.IO připojeno');
        this.isConnected = true;
        
        // Získání user ID z JWT tokenu
        const userData = this.parseJwt(this.authToken);
        if (userData && userData.id) {
          // Informovat server o připojení uživatele
          this.socket.emit(EVENT_CONNECTED, { userId: userData.id });
        }
      });
      
      this.socket.on('disconnect', () => {
        console.log('Socket.IO odpojeno');
        this.isConnected = false;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO chyba připojení:', error);
        this.isConnected = false;
      });
      
      // Nastavení handlerů pro specifické události
      this.socket.on(EVENT_NEW_MESSAGE, (data) => {
        this.triggerEventHandlers(EVENT_NEW_MESSAGE, data);
      });
      
      this.socket.on(EVENT_STREAM_START, (data) => {
        this.triggerEventHandlers(EVENT_STREAM_START, data);
      });
      
      this.socket.on(EVENT_STREAM_CHUNK, (data) => {
        this.triggerEventHandlers(EVENT_STREAM_CHUNK, data);
      });
      
      this.socket.on(EVENT_STREAM_END, (data) => {
        this.triggerEventHandlers(EVENT_STREAM_END, data);
      });
      
      this.socket.on(EVENT_ERROR, (data) => {
        this.triggerEventHandlers(EVENT_ERROR, data);
      });
      
      this.socket.on(EVENT_TYPING, (data) => {
        this.triggerEventHandlers(EVENT_TYPING, data);
      });
      
      this.socket.on(EVENT_AI_TYPING, (data) => {
        this.triggerEventHandlers(EVENT_AI_TYPING, data);
      });
      
      this.socket.on(EVENT_NEW_ACHIEVEMENTS, (data) => {
        this.triggerEventHandlers(EVENT_NEW_ACHIEVEMENTS, data);
      });
    } catch (error) {
      console.error('Chyba při inicializaci Socket.IO:', error);
    }
  }
  
  /**
   * Odpojí WebSocket spojení
   */
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  /**
   * Připojení ke konverzaci (místnosti)
   * @param {string} conversationId - ID konverzace
   */
  joinConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit(EVENT_JOIN_CONVERSATION, conversationId);
    } else if (this.authToken) {
      // Pokud socket není připojen, ale máme token, zkusíme inicializovat
      this.initSocket();
      // Nastavíme timeout pro připojení ke konverzaci po inicializaci socketu
      setTimeout(() => {
        if (this.socket && this.isConnected) {
          this.socket.emit(EVENT_JOIN_CONVERSATION, conversationId);
        }
      }, 1000);
    }
  }
  
  /**
   * Opuštění konverzace (místnosti)
   * @param {string} conversationId - ID konverzace
   */
  leaveConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit(EVENT_LEAVE_CONVERSATION, conversationId);
    }
  }
  
  /**
   * Odeslání zprávy přes Socket.IO
   * @param {string} conversationId - ID konverzace
   * @param {string} message - Obsah zprávy
   * @param {string} characterId - ID postavy
   * @returns {Promise<boolean>} - Úspěch odeslání
   */
  sendMessage(conversationId, message, characterId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket.IO není připojeno'));
        return;
      }
      
      // Získání user ID z JWT tokenu
      const userData = this.parseJwt(this.authToken);
      if (!userData || !userData.id) {
        reject(new Error('Uživatel není přihlášen'));
        return;
      }
      
      const data = {
        conversationId,
        message,
        userId: userData.id,
        characterId,
        timestamp: Date.now()
      };
      
      this.socket.emit(EVENT_SEND_MESSAGE, data);
      resolve(true);
    });
  }
  
  /**
   * Odeslání informace o psaní
   * @param {string} conversationId - ID konverzace
   * @param {boolean} isTyping - Zda uživatel píše
   */
  sendTypingStatus(conversationId, isTyping) {
    if (this.socket && this.isConnected) {
      // Získání user ID z JWT tokenu
      const userData = this.parseJwt(this.authToken);
      if (userData && userData.id) {
        this.socket.emit(EVENT_TYPING, {
          conversationId,
          userId: userData.id,
          isTyping
        });
      }
    }
  }
  
  /**
   * Registrace handleru pro Socket.IO události
   * @param {string} event - Název události
   * @param {Function} handler - Handler funkce
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }
  
  /**
   * Odregistrace handleru pro Socket.IO události
   * @param {string} event - Název události
   * @param {Function} handler - Handler funkce
   */
  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }
  
  /**
   * Vyvolání handlerů pro událost
   * @param {string} event - Název události
   * @param {*} data - Data události
   */
  triggerEventHandlers(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Chyba v handleru pro událost ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Rozložení JWT tokenu pro získání informací
   * @param {string} token - JWT token
   * @returns {Object|null} - Dekódovaný payload tokenu nebo null
   */
  parseJwt(token) {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Chyba při parsování JWT:', error);
      return null;
    }
  }
  
  /**
   * Obnoví auth token
   * @returns {Promise<boolean>} - Úspěch obnovy tokenu
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }
      
      const response = await this.client.post('/auth/refresh', {
        refresh_token: refreshToken
      });
      
      if (response.data && response.data.token) {
        this.setAuthToken(response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
        
        // Reinicializace socket spojení s novým tokenem
        this.initSocket();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Chyba při obnovování tokenu:', error);
      return false;
    }
  }
  
  /**
   * Odhlásí uživatele
   */
  async logout() {
    try {
      // Pokus o serverové odhlášení
      if (this.authToken) {
        await this.client.post('/auth/logout');
      }
    } catch (error) {
      console.error('Chyba při odhlašování ze serveru:', error);
    } finally {
      // Lokální odhlášení
      this.disconnectSocket();
      this.setAuthToken(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      
      // Vyčištění cache
      this.clearCache();
      
      // Vyvolání události odhlášení
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }
  
  /**
   * Generuje klíč pro cache
   * @param {string} url - URL požadavku
   * @param {Object} params - Parametry požadavku
   * @returns {string} - Klíč pro cache
   */
  getCacheKey(url, params = {}) {
    return `${url}:${JSON.stringify(params)}`;
  }
  
  /**
   * Zkontroluje, zda je cache položka stále platná
   * @param {Object} cachedItem - Cache položka
   * @returns {boolean} - True pokud je platná
   */
  isCacheValid(cachedItem) {
    if (!cachedItem) return false;
    return (new Date() - cachedItem.timestamp) < CACHE_DURATION;
  }
  
  /**
   * Provede GET požadavek s cachováním
   * @param {string} url - API endpoint
   * @param {Object} params - Query parametry
   * @param {Object} options - Možnosti požadavku
   * @returns {Promise} - Promise s odpovědí
   */
  async get(url, params = {}, options = {}) {
    const { skipCache = false, cacheDuration = CACHE_DURATION } = options;
    const cacheKey = this.getCacheKey(url, params);
    
    // Zkontrolujeme cache, pokud není skipCache
    if (!skipCache) {
      const cachedItem = this.cache.get(cacheKey);
      if (this.isCacheValid(cachedItem)) {
        console.log(`Cache hit for ${url}`);
        return cachedItem.data;
      }
    }
    
    try {
      const response = await this.client.get(url, { params });
      
      // Uložíme odpověď do cache, pokud je úspěšná
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: new Date(),
        cacheDuration
      });
      
      return response.data;
    } catch (error) {
      // Zpracování chyb
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Provede POST požadavek
   * @param {string} url - API endpoint
   * @param {Object} data - Data požadavku
   * @param {Object} options - Možnosti požadavku
   * @returns {Promise} - Promise s odpovědí
   */
  async post(url, data = {}, options = {}) {
    const { invalidateCache = [] } = options;
    
    try {
      const response = await this.client.post(url, data);
      
      // Invaliduje související cache záznamy, pokud je třeba
      if (invalidateCache.length > 0) {
        invalidateCache.forEach(cacheUrl => {
          this.invalidateCache(cacheUrl);
        });
      }
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Provede PUT požadavek
   * @param {string} url - API endpoint
   * @param {Object} data - Data požadavku
   * @param {Object} options - Možnosti požadavku
   * @returns {Promise} - Promise s odpovědí
   */
  async put(url, data = {}, options = {}) {
    const { invalidateCache = [] } = options;
    
    try {
      const response = await this.client.put(url, data);
      
      // Invaliduje související cache záznamy, pokud je třeba
      if (invalidateCache.length > 0) {
        invalidateCache.forEach(cacheUrl => {
          this.invalidateCache(cacheUrl);
        });
      }
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Provede DELETE požadavek
   * @param {string} url - API endpoint
   * @param {Object} options - Možnosti požadavku
   * @returns {Promise} - Promise s odpovědí
   */
  async delete(url, options = {}) {
    const { invalidateCache = [] } = options;
    
    try {
      const response = await this.client.delete(url);
      
      // Invaliduje související cache záznamy, pokud je třeba
      if (invalidateCache.length > 0) {
        invalidateCache.forEach(cacheUrl => {
          this.invalidateCache(cacheUrl);
        });
      }
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Nahraje soubor
   * @param {string} url - API endpoint
   * @param {FormData} formData - FormData se souborem
   * @param {Function} onProgress - Callback pro průběh
   * @param {Object} options - Další nastavení
   * @returns {Promise} - Promise s odpovědí
   */
  async uploadFile(url, formData, onProgress = null, options = {}) {
    try {
      // Nastavení hlaviček pro upload
      const headers = {
        'Content-Type': 'multipart/form-data'
      };
      
      // Přidání Auth tokenu, pokud je k dispozici
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      
      // Rozšíření o vlastní hlavičky
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
      
      const response = await this.client.post(url, formData, {
        headers,
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        } : undefined,
        timeout: options.timeout || 60000 // Delší timeout pro uploady (60s)
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Stáhne soubor
   * @param {string} url - API endpoint
   * @param {Object} params - Query parametry
   * @param {Function} onProgress - Callback pro průběh
   * @returns {Promise<Blob>} - Promise s obsahem souboru jako Blob
   */
  async downloadFile(url, params = {}, onProgress = null) {
    try {
      const response = await this.client.get(url, {
        params,
        responseType: 'blob',
        onDownloadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        } : undefined
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Generuje řeč z textu
   * @param {string} text - Text k převodu na řeč
   * @param {string} voiceId - ID hlasového profilu
   * @param {Object} options - Další možnosti
   * @returns {Promise<Object>} - Informace o vygenerovaném audio souboru
   */
  async generateSpeech(text, voiceId, options = {}) {
    try {
      const response = await this.client.post('/voice/generate', {
        text,
        voiceId,
        ...options
      });
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Získá dostupné hlasové profily
   * @param {string} language - Volitelný filtr podle jazyka
   * @param {boolean} includePremium - Zda zahrnout prémiové hlasy
   * @returns {Promise<Array>} - Seznam hlasových profilů
   */
  async getVoiceProfiles(language = null, includePremium = true) {
    try {
      const params = {};
      if (language) {
        params.language = language;
      }
      params.includePremium = includePremium;
      
      const response = await this.get('/voice/profiles', params);
      return response.profiles || [];
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Generuje odpověď od AI modelu
   * @param {string} prompt - Text promptu
   * @param {Object} options - Možnosti generování
   * @param {boolean} stream - Zda použít streaming odpovědí
   * @returns {Promise<Object|ReadableStream>} - Odpověď modelu nebo stream
   */
  async generateModelResponse(prompt, options = {}, stream = false) {
    try {
      if (stream) {
        // Pro streaming použijeme fetch API přímo, protože axios nepodporuje správně streaming
        const response = await fetch(`${API_URL}/model/generate-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.authToken ? `Bearer ${this.authToken}` : undefined
          },
          body: JSON.stringify({
            prompt,
            ...options
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.body;
      } else {
        // Pro běžné odpovědi použijeme axios
        const response = await this.client.post('/model/generate', {
          prompt,
          ...options
        });
        
        return response.data;
      }
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Invaliduje cache pro specifický vzor URL
   * @param {string} urlPattern - Vzor URL k invalidaci
   */
  invalidateCache(urlPattern) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Vyčistí celou cache
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Zpracuje běžné API chyby
   * @param {Error} error - Objekt chyby
   */
  handleError(error) {
    if (error.response) {
      // Server odpověděl stavovým kódem mimo rozsah 2xx
      console.error('API Error:', error.response.status, error.response.data);
      
      // Přidání vlastnosti pro snadnější zpracování ve vyšších vrstvách
      error.statusCode = error.response.status;
      error.apiMessage = error.response.data.error || error.response.data.message || 'Unknown API error';
    } else if (error.request) {
      // Požadavek byl odeslán, ale nepřišla žádná odpověď
      console.error('API No Response:', error.request);
      error.statusCode = 0;
      error.apiMessage = 'No response from server';
    } else {
      // Chyba při nastavování požadavku
      console.error('API Request Error:', error.message);
      error.statusCode = -1;
      error.apiMessage = 'Request setup error';
    }
  }
  
  /**
   * Vytvoří URL s query parametry
   * @param {string} baseUrl - Základní URL
   * @param {Object} params - Query parametry
   * @returns {string} - Kompletní URL
   */
  buildUrl(baseUrl, params = {}) {
    const url = new URL(baseUrl, API_URL);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    return url.toString();
  }
  
  // API METODY PRO ZJEDNODUŠENÍ POUŽITÍ
  
  /**
   * Registrace uživatele
   */
  async register(userData) {
    const response = await this.post('/users/register', userData);
    if (response.success && response.token) {
      this.setAuthToken(response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('user_data', JSON.stringify({
        id: response.id,
        username: response.username,
        email: response.email
      }));
      // Inicializace socket spojení po přihlášení
      this.initSocket();
    }
    return response;
  }
  
  /**
   * Přihlášení uživatele
   */
  async login(credentials) {
    const response = await this.post('/users/login', credentials);
    if (response.success && response.token) {
      this.setAuthToken(response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('user_data', JSON.stringify({
        id: response.id,
        username: response.username,
        email: response.email
      }));
      // Inicializace socket spojení po přihlášení
      this.initSocket();
    }
    return response;
  }
  
  /**
   * Získání postav uživatele
   */
  async getCharacters(userId, params = {}) {
    return await this.get(`/users/${userId}/characters`, params);
  }
  
  /**
   * Vytvoření nové postavy
   */
  async createCharacter(characterData) {
    return await this.post('/characters', characterData, {
      invalidateCache: ['/users', '/characters']
    });
  }
  
  /**
   * Aktualizace postavy
   */
  async updateCharacter(characterId, characterData) {
    return await this.put(`/characters/${characterId}`, characterData, {
      invalidateCache: ['/users', '/characters']
    });
  }
  
  /**
   * Odstranění postavy
   */
  async deleteCharacter(characterId) {
    return await this.delete(`/characters/${characterId}`, {
      invalidateCache: ['/users', '/characters']
    });
  }
  
  /**
   * Získání konverzací uživatele
   */
  async getConversations(userId, params = {}) {
    return await this.get(`/users/${userId}/conversations`, params);
  }
  
  /**
   * Vytvoření nové konverzace
   */
  async createConversation(conversationData) {
    return await this.post('/conversations', conversationData, {
      invalidateCache: ['/users', '/conversations']
    });
  }
  
  /**
   * Získání detailu konverzace
   */
  async getConversation(conversationId) {
    return await this.get(`/conversations/${conversationId}`);
  }
  
  /**
   * Přidání zprávy do konverzace
   */
  async addMessage(conversationId, messageData) {
    return await this.post(`/conversations/${conversationId}/messages`, messageData, {
      invalidateCache: [`/conversations/${conversationId}`]
    });
  }
  
  /**
   * Získání úspěchů uživatele
   */
  async getUserAchievements(userId) {
    return await this.get(`/users/${userId}/achievements`);
  }
  
  /**
   * Generování příběhu
   */
  async generateStory(storyData) {
    return await this.post('/story/generate', storyData);
  }
  
  /**
   * Generování obrázků
   */
  async generateImage(imageData) {
    return await this.post('/images/generate', imageData);
  }
  
  /**
   * Nahrání souboru
   */
  async uploadImage(file, options = {}, onProgress = null) {
    const formData = new FormData();
    formData.append('image', file);
    
    // Přidání dalších parametrů
    Object.keys(options).forEach(key => {
      if (options[key] !== undefined && options[key] !== null) {
        formData.append(key, options[key]);
      }
    });
    
    return await this.uploadFile('/uploads', formData, onProgress);
  }
  
  /**
   * Export postav
   */
  async exportCharacters(userId, characterIds = []) {
    const params = {};
    if (characterIds.length > 0) {
      params.characterIds = characterIds.join(',');
    }
    
    const blob = await this.downloadFile(`/users/${userId}/characters/export`, params);
    return blob;
  }
  
  /**
   * Import postav
   */
  async importCharacters(file, onProgress = null) {
    const formData = new FormData();
    formData.append('charactersFile', file);
    
    return await this.uploadFile('/characters/import', formData, onProgress);
  }
  
  /**
   * Kontrola dostupnosti AI modelů
   */
  async checkModelStatus() {
    return await this.get('/model/status');
  }
  
  /**
   * Kontrola dostupnosti hlasových služeb
   */
  async checkVoiceStatus() {
    return await this.get('/voice/status');
  }
  
  /**
   * Získání systémových informací
   */
  async getSystemInfo() {
    return await this.get('/system/info');
  }
}

// Vytvoření singleton instance
const apiClient = new ApiClient();

// Export konstanty pro Socket.IO události
export {
  EVENT_CONNECTED,
  EVENT_ERROR,
  EVENT_NEW_MESSAGE,
  EVENT_STREAM_START,
  EVENT_STREAM_CHUNK,
  EVENT_STREAM_END,
  EVENT_JOIN_CONVERSATION,
  EVENT_LEAVE_CONVERSATION,
  EVENT_SEND_MESSAGE,
  EVENT_TYPING,
  EVENT_AI_TYPING,
  EVENT_NEW_ACHIEVEMENTS
};

export default apiClient;