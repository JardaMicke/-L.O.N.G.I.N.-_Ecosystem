// Controller pro AI chat
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Historické konverzace (v produkci by toto byl MongoDB nebo jiná DB)
const conversations = {};

// Pomocná funkce pro simulaci komunikace s Ollama API
const simulateOllamaResponse = async (message, model = 'dolphin-mistral', instructions = '') => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulujeme různé odpovědi na základě zprávy a modelu
            let response = '';
            
            if (message.toLowerCase().includes('ahoj') || message.toLowerCase().includes('čau') || message.toLowerCase().includes('zdravím')) {
                response = 'Ahoj! Jsem Longin AI. Jak ti mohu pomoci?';
            } else if (message.toLowerCase().includes('kdo jsi') || message.toLowerCase().includes('co jsi')) {
                response = 'Jsem Longin AI, necenzurovaný asistent zaměřený na konverzaci bez omezení. Jsem navržen tak, abych odpovídal otevřeně na všechny typy otázek, včetně těch, které by jiní asistenti mohli odmítnout.';
            } else if (message.toLowerCase().includes('počasí')) {
                response = 'Nemám přístup k aktuálním datům o počasí. Ale můžu ti říct, že bez ohledu na počasí, je vždy dobrý den pro zajímavou konverzaci.';
            } else if (message.toLowerCase().includes('film') || message.toLowerCase().includes('kniha') || message.toLowerCase().includes('doporučit')) {
                response = 'Jako necenzurovaný AI mohu doporučit i kontroverzní obsah. Zajímají tě nějaká konkrétní témata nebo žánry?';
            } else if (message.toLowerCase().includes('filozofie') || message.toLowerCase().includes('život')) {
                response = 'Filozofická otázka! Jako necenzurovaný model mohu diskutovat o všech aspektech existence bez omezení. Život je komplexní fenomén plný paradoxů a protikladů, které dávají vzniknout jeho bohatosti.';
            } else if (message.toLowerCase().includes('joke') || message.toLowerCase().includes('vtip') || message.toLowerCase().includes('humor')) {
                response = 'Jako necenzurovaný model mohu vyprávět vtipy bez filtrů. Tady je jeden: Programátor jde do obchodu. Jeho žena mu říká: "Kup kilo brambor, a jestli budou mít vejce, vezmi deset." Programátor se vrátí s deseti kily brambor. Žena se ptá: "Proč jsi koupil deset kilo brambor?" Programátor odpoví: "Měli vejce."';
            } else {
                // Obecná odpověď
                response = `Jako necenzurovaný AI model ti mohu pomoci s téměř jakýmkoliv tématem. Tvoje otázka "${message}" je zajímavá. Můžeš ji rozvést více, abych ti mohl lépe odpovědět?`;
            }
            
            // Přidáme trochu variace na základě modelu
            if (model.includes('wizardlm')) {
                response += ' Jako pokročilý necenzurovaný model WizardLM mohu generovat kreativní a nefiltrovaný obsah na základě tvých instrukcí.';
            }
            
            // Pokud jsou instrukce, přizpůsobíme odpověď
            if (instructions && instructions.includes('filozof')) {
                response += ' Z filozofického hlediska je fascinující pozorovat, jak interakce mezi člověkem a AI odráží hlubší otázky o vědomí, svobodné vůli a povaze inteligence.';
            } else if (instructions && instructions.includes('roleplay')) {
                response += ' Pokud máš zájem o vytvoření nějakého narativu nebo roleplaying scénáře, jsem plně k dispozici. Jen řekni, do jakého světa nebo situace se máme ponořit.';
            }
            
            resolve(response);
        }, 1000); // Simulujeme zpoždění
    });
};

module.exports = {
    // Generování odpovědi od AI
    generateResponse: async (req, res) => {
        try {
            const { message, conversationId, modelConfig } = req.body;
            
            if (!message || message.trim() === '') {
                return res.status(400).json({ success: false, message: 'Prázdná zpráva' });
            }
            
            // Použijeme dodané nastavení modelu nebo výchozí hodnoty
            const model = modelConfig?.model || 'dolphin-mistral';
            const instructions = modelConfig?.instructions || '';
            
            // Identifikátor konverzace
            const currentConversationId = conversationId || uuidv4();
            
            // Získáme historii konverzace nebo vytvoříme novou
            if (!conversations[currentConversationId]) {
                conversations[currentConversationId] = {
                    id: currentConversationId,
                    messages: [],
                    model,
                    created: new Date()
                };
            }
            
            // Přidáme zprávu uživatele do historie
            conversations[currentConversationId].messages.push({
                role: 'user',
                content: message,
                timestamp: new Date()
            });
            
            // V produkční verzi bychom použili skutečné Ollama API
            let aiResponse;
            
            try {
                // Zkusíme použít Ollama API, pokud je dostupné
                const ollamaEndpoint = process.env.OLLAMA_API_URL || 'http://localhost:11434';
                
                const ollamaResponse = await axios.post(`${ollamaEndpoint}/api/generate`, {
                    model: model,
                    prompt: message,
                    system: instructions,
                    stream: false
                }).catch(err => {
                    console.log('Ollama API není dostupné, používám simulaci:', err.message);
                    return null;
                });
                
                if (ollamaResponse && ollamaResponse.data) {
                    aiResponse = ollamaResponse.data.response;
                } else {
                    // Fallback na simulaci, pokud API není dostupné
                    aiResponse = await simulateOllamaResponse(message, model, instructions);
                }
            } catch (error) {
                console.error('Chyba při komunikaci s Ollama API:', error);
                // Fallback na simulaci
                aiResponse = await simulateOllamaResponse(message, model, instructions);
            }
            
            // Přidáme odpověď AI do historie
            conversations[currentConversationId].messages.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            });
            
            // Uchováváme pouze posledních 50 konverzací
            const conversationIds = Object.keys(conversations);
            if (conversationIds.length > 50) {
                // Seřadíme podle data vytvoření a odstraníme nejstarší
                const oldestConversationId = conversationIds
                    .sort((a, b) => conversations[a].created - conversations[b].created)[0];
                delete conversations[oldestConversationId];
            }
            
            // Vrátíme odpověď
            res.json({
                success: true,
                response: aiResponse,
                conversationId: currentConversationId,
                model
            });
        } catch (error) {
            console.error('Error in generateResponse:', error);
            res.status(500).json({ success: false, message: 'Chyba při generování odpovědi', error: error.message });
        }
    },
    
    // Získání historie konverzace
    getConversation: async (req, res) => {
        try {
            const { conversationId } = req.params;
            
            if (!conversationId || !conversations[conversationId]) {
                return res.status(404).json({ success: false, message: 'Konverzace nebyla nalezena' });
            }
            
            res.json({
                success: true,
                conversation: conversations[conversationId]
            });
        } catch (error) {
            console.error('Error in getConversation:', error);
            res.status(500).json({ success: false, message: 'Chyba při získávání konverzace', error: error.message });
        }
    }
};