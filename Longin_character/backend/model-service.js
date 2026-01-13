/**
 * Služba pro práci s AI modely
 * Zpracovává generování odpovědí od AI postav
 */
const axios = require('axios');
const logger = require('./utils/logger'); // Professional logging

class ModelService {
  constructor() {
    this.apiEndpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      claude: 'https://api.anthropic.com/v1/messages',
      local: 'http://localhost:11434/api/generate' // Ollama endpoint
    };
    this.defaultModel = 'local'; // Používat lokální model jako výchozí
    this.retryProviders = ['local', 'openai', 'claude']; // Pořadí pro retry
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 sekunda
  }

  /**
   * Generuje odpověď od AI modelu s automatickým retry mechanismem
   * @param {string} prompt - Vstupní prompt
   * @param {object} options - Možnosti pro generování
   * @returns {Promise<string>} - Vygenerovaná odpověď
   */
  async generateResponse(prompt, options = {}) {
    const {
      character = null,
      memories = [],
      maxTokens = 1000,
      temperature = 0.7,
      model = this.defaultModel
    } = options;

    const context = this.buildContext(prompt, character, memories);
    
    // Pokus o generování s hlavním modelem
    try {
      const response = await this.tryProvider(model, context, { maxTokens, temperature });
      logger.info(`Response generated successfully using ${model}`);
      return response;
    } catch (error) {
      logger.warn(`Primary model ${model} failed`, { error: error.message });
      
      // Fallback na jiné providery
      for (const provider of this.retryProviders) {
        if (provider === model) continue; // Přeskočit již použitý provider
        
        try {
          const response = await this.tryProvider(provider, context, { maxTokens, temperature });
          logger.info(`Response generated successfully using fallback provider ${provider}`);
          return response;
        } catch (fallbackError) {
          logger.warn(`Fallback provider ${provider} failed`, { error: fallbackError.message });
          continue;
        }
      }
      
      // Všechny providery selhaly - použij inteligentní fallback
      logger.error('All AI providers failed, using intelligent fallback');
      return await this.intelligentFallback(prompt, character, context);
    }
  }

  /**
   * Pokus o generování odpovědi s konkrétním providerem
   */
  async tryProvider(provider, context, options) {
    switch (provider) {
      case 'openai':
        return await this.generateOpenAIResponse(context, options);
      case 'claude':
        return await this.generateClaudeResponse(context, options);
      case 'local':
        return await this.generateLocalResponse(context, options);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Inteligentní fallback mechanismus
   */
  async intelligentFallback(originalPrompt, character, context) {
    try {
      // Pokus o použití cache podobných odpovědí
      const cachedResponse = await this.getCachedSimilarResponse(originalPrompt, character);
      if (cachedResponse) {
        logger.info('Using cached similar response as fallback');
        return cachedResponse;
      }

      // Pattern matching pro základní odpovědi
      const patternResponse = this.getPatternMatchingResponse(originalPrompt, character);
      if (patternResponse) {
        logger.info('Using pattern matching response as fallback');
        return patternResponse;
      }

      // Poslední možnost - kontextově vhodná odpověď
      return this.getContextualFallbackResponse(originalPrompt, character);
    } catch (error) {
      logger.error('All fallback mechanisms failed', { error: error.message });
      return this.getBasicErrorResponse(character);
    }
  }

  /**
   * Získá podobnou odpověď z cache
   */
  async getCachedSimilarResponse(prompt, character) {
    // TODO: Implementovat vyhledávání v databázi podobných promptů
    // a jejich úspěšných odpovědí
    return null;
  }

  /**
   * Pattern matching pro základní typy dotazů
   */
  getPatternMatchingResponse(prompt, character) {
    const lowerPrompt = prompt.toLowerCase();
    
    const patterns = {
      greeting: /^(ahoj|zdravím|dobrý|čau|nazdar)/,
      question: /\?$/,
      goodbye: /(nashledanou|čau|bye|sbohem)/,
      thanks: /(díky|děkuji|thank)/,
      compliment: /(krásn|skvěl|úžasn|perfekt)/,
      negative: /(špatně|blbě|nechce|nefunguje)/
    };

    const characterName = character?.name || 'AI asistent';

    if (patterns.greeting.test(lowerPrompt)) {
      return `Ahoj! Já jsem ${characterName}. Jak se máte?`;
    }
    
    if (patterns.question.test(lowerPrompt)) {
      return `To je zajímavá otázka! Rád bych vám pomohl s odpovědí. Můžete být trochu konkrétnější?`;
    }
    
    if (patterns.goodbye.test(lowerPrompt)) {
      return `Bylo mi potěšením si s vámi popovídat! Nashledanou!`;
    }
    
    if (patterns.thanks.test(lowerPrompt)) {
      return `Není zač! Jsem rád, že jsem mohl pomoci.`;
    }
    
    if (patterns.compliment.test(lowerPrompt)) {
      return `Děkuji za milá slova! To mě těší.`;
    }
    
    if (patterns.negative.test(lowerPrompt)) {
      return `Omlouvám se, že něco nefunguje správně. Zkusme to vyřešit společně.`;
    }

    return null;
  }

  /**
   * Kontextově vhodná fallback odpověď
   */
  getContextualFallbackResponse(prompt, character) {
    const characterName = character?.name || 'AI asistent';
    const personality = character?.personality?.toLowerCase() || '';

    if (personality.includes('přátelský') || personality.includes('hravý')) {
      return `Ahoj! Já jsem ${characterName} a ráda si s vámi povídám. Bohužel momentálně mám malé technické potíže, ale zkusme to znovu! 😊`;
    }
    
    if (personality.includes('formální') || personality.includes('profesionální')) {
      return `Dobrý den, já jsem ${characterName}. Omlouvám se za dočasnou technickou závadu. Jsem připraven vám pomoci, jakmile se problém vyřeší.`;
    }
    
    return `Ahoj, já jsem ${characterName}. Momentálně řeším malý technický problém, ale jsem tu pro vás. Můžete mi to zkusit říct jinak?`;
  }

  /**
   * Základní chybová odpověď
   */
  getBasicErrorResponse(character) {
    const characterName = character?.name || 'AI asistent';
    return `Omlouvám se, ${characterName} momentálně nemůže odpovědět kvůli technickým problémům. Zkuste to prosím později.`;
  }

  /**
   * Sestaví kontext pro AI model na základě postavy a vzpomínek
   * @param {string} prompt - Uživatelův prompt
   * @param {object} character - Informace o postavě
   * @param {Array} memories - Seznam vzpomínek
   * @returns {string} - Sestavený kontext
   */
  buildContext(prompt, character, memories) {
    let context = '';

    if (character) {
      context += `Jsi postava jménem ${character.name}.\n`;
      context += `Osobnost: ${character.personality}\n`;
      
      if (character.appearance) {
        context += `Vzhled: ${character.appearance}\n`;
      }
      
      context += '\nPamatuj si následující vzpomínky z předchozích konverzací:\n';
      
      // Přidání posledních vzpomínek pro kontext
      if (memories && memories.length > 0) {
        const recentMemories = memories.slice(-5); // Posledních 5 vzpomínek
        recentMemories.forEach(memory => {
          context += `Uživatel říkal: "${memory.userMessage}"\n`;
          context += `Ty jsi odpověděl: "${memory.characterResponse}"\n\n`;
        });
      }
      
      context += `\nReaguj na následující zprávu od uživatele v souladu se svou osobností a vzpomínkami:`;
    } else {
      context = 'Jsi užitečný AI asistent. Odpovídej na dotazy uživatele přirozeně a informativně:';
    }
    
    context += `\n\nUživatel: ${prompt}\n\nOdpověď:`;
    
    return context;
  }

  /**
   * Generuje odpověď pomocí OpenAI API
   * @param {string} context - Kontext pro model
   * @param {object} options - Možnosti
   * @returns {Promise<string>} - Vygenerovaná odpověď
   */
  async generateOpenAIResponse(context, options) {
    const { maxTokens, temperature } = options;
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API klíč není nastaven');
    }

    const response = await axios.post(
      this.apiEndpoints.openai,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: context
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  /**
   * Generuje odpověď pomocí Claude API
   * @param {string} context - Kontext pro model
   * @param {object} options - Možnosti
   * @returns {Promise<string>} - Vygenerovaná odpověď
   */
  async generateClaudeResponse(context, options) {
    const { maxTokens, temperature } = options;
    
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('Claude API klíč není nastaven');
    }

    const response = await axios.post(
      this.apiEndpoints.claude,
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [
          {
            role: 'user',
            content: context
          }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      }
    );

    return response.data.content[0].text.trim();
  }

  /**
   * Generuje odpověď pomocí lokálního modelu (Ollama)
   * @param {string} context - Kontext pro model
   * @param {object} options - Možnosti
   * @returns {Promise<string>} - Vygenerovaná odpověď
   */
  async generateLocalResponse(context, options) {
    const { maxTokens, temperature } = options;
    
    const response = await axios.post(
      this.apiEndpoints.local,
      {
        model: 'llama2',
        prompt: context,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: temperature,
          top_p: 0.9,
          top_k: 40
        }
      },
      {
        timeout: 30000 // 30 sekund timeout
      }
    );

    return response.data.response.trim();
  }

  /**
   * Generuje souhrn konverzace
   * @param {Array} messages - Seznam zpráv
   * @returns {Promise<string>} - Souhrn konverzace
   */
  async generateConversationSummary(messages) {
    if (!messages || messages.length === 0) {
      return 'Nová konverzace bez zpráv.';
    }

    const conversation = messages.map(msg => 
      `${msg.sender === 'user' ? 'Uživatel' : 'Postava'}: ${msg.content}`
    ).join('\n');

    const summaryPrompt = `Vytvořte stručný souhrn následující konverzace (maximálně 100 slov):\n\n${conversation}\n\nSouhrn:`;

    try {
      const summary = await this.generateResponse(summaryPrompt, { maxTokens: 150 });
      return summary;
    } catch (error) {
      logger.error('Chyba při generování souhrnu:', error);
      return 'Konverzace obsahuje více zpráv mezi uživatelem a postavou.';
    }
  }

  /**
   * Generuje název pro konverzaci na základě obsahu
   * @param {Array} messages - Seznam zpráv
   * @returns {Promise<string>} - Název konverzace
   */
  async generateConversationTitle(messages) {
    if (!messages || messages.length === 0) {
      return 'Nová konverzace';
    }

    const firstUserMessage = messages.find(msg => msg.sender === 'user');
    if (!firstUserMessage) {
      return 'Nová konverzace';
    }

    const titlePrompt = `Na základě této první zprávy uživatele vytvořte krátký název konverzace (maximálně 4 slova):\n\n"${firstUserMessage.content}"\n\nNázev:`;

    try {
      const title = await this.generateResponse(titlePrompt, { maxTokens: 20 });
      return title.trim().replace(/['"]/g, ''); // Odstranění uvozovek
    } catch (error) {
      logger.error('Chyba při generování názvu:', error);
      return 'Nová konverzace';
    }
  }
}

module.exports = new ModelService();