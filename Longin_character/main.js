// Hlavní aplikace pro Longin charakter AI

// Základní nastavení
const API_BASE_URL = 'http://localhost:3000';
let isProcessing = false;

// Helper funkce pro zobrazení chybových hlášek
function showError(message) {
    alert(message);
}

// Helper funkce pro zobrazení načítání
function showLoading(container, message = 'Zpracovávám...') {
    container.innerHTML = `<div class="loading"><p>${message}</p><div class="spinner"></div></div>`;
}

// Tab switching funkce
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Odstranit aktivní třídy ze všech tabů a obsahů
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Přidat aktivní třídu kliknutému tabu
        tab.classList.add('active');
        
        // Přidat aktivní třídu odpovídajícímu obsahu
        const tabId = tab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Funkce pro vylepšení promptu
document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const textArea = btn.closest('.prompt-container').querySelector('textarea');
        const originalPrompt = textArea.value;
        
        if(originalPrompt.trim() === '') {
            showError('Nejprve zadejte nějaký prompt k vylepšení!');
            return;
        }
        
        const promptType = btn.closest('.tab-content').id.includes('video') ? 'video' : 'image';
        
        try {
            // Zobrazit načítání
            btn.textContent = 'Vylepšuji...';
            btn.disabled = true;
            
            const response = await fetch(`${API_BASE_URL}/api/improve-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    originalPrompt,
                    type: promptType
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                textArea.value = data.improvedPrompt;
            } else {
                showError(data.message || 'Nepodařilo se vylepšit prompt.');
            }
        } catch (error) {
            showError('Chyba při komunikaci se serverem.');
            console.error('Error:', error);
        } finally {
            btn.textContent = 'Vylepšit prompt';
            btn.disabled = false;
        }
    });
});

// Text-to-Image generace
document.getElementById('generate-image').addEventListener('click', async () => {
    const prompt = document.getElementById('text-prompt').value;
    const previewContainer = document.querySelector('#text-to-image .preview-container');
    
    if(prompt.trim() === '') {
        showError('Zadejte prosím popis obrázku!');
        return;
    }
    
    if (isProcessing) {
        showError('Počkejte prosím na dokončení aktuálního procesu.');
        return;
    }
    
    try {
        isProcessing = true;
        
        // Zobrazit načítání
        showLoading(previewContainer, 'Generuji obrázek...');
        
        const response = await fetch(`${API_BASE_URL}/api/text-to-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            previewContainer.innerHTML = `
                <img src="${data.image}" alt="Vygenerovaný obrázek">
                <div class="image-info">
                    <p>Prompt: ${data.prompt}</p>
                    <p>Vytvořeno: ${new Date(data.timestamp).toLocaleString()}</p>
                    <button class="download-btn" data-src="${data.image}">Stáhnout obrázek</button>
                </div>
            `;
            
            // Přidat event listener pro tlačítko stažení
            document.querySelector('.download-btn').addEventListener('click', function(e) {
                const link = document.createElement('a');
                link.href = this.getAttribute('data-src');
                link.download = `longin-ai-image-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        } else {
            showError(data.message || 'Nepodařilo se vygenerovat obrázek.');
            previewContainer.innerHTML = '<p>Chyba při generování obrázku</p>';
        }
    } catch (error) {
        showError('Chyba při komunikaci se serverem.');
        console.error('Error:', error);
        previewContainer.innerHTML = '<p>Chyba při komunikaci se serverem</p>';
    } finally {
        isProcessing = false;
    }
});

// Image-to-Image transformace
document.getElementById('transform-image').addEventListener('click', async () => {
    const instructions = document.getElementById('image-instructions').value;
    const fileInput = document.getElementById('source-image');
    const previewContainer = document.querySelector('#image-to-image .preview-container');
    
    if (!fileInput.files || !fileInput.files[0]) {
        showError('Vyberte prosím zdrojový obrázek!');
        return;
    }
    
    if (isProcessing) {
        showError('Počkejte prosím na dokončení aktuálního procesu.');
        return;
    }
    
    try {
        isProcessing = true;
        
        // Zobrazit načítání
        showLoading(previewContainer, 'Transformuji obrázek...');
        
        const formData = new FormData();
        formData.append('sourceImage', fileInput.files[0]);
        formData.append('instructions', instructions);
        
        const response = await fetch(`${API_BASE_URL}/api/image-to-image`, {
            method: 'POST',
            body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
            previewContainer.innerHTML = `
                <div class="comparison">
                    <div class="before">
                        <h4>Před</h4>
                        <img src="${data.originalImage}" alt="Původní obrázek">
                    </div>
                    <div class="after">
                        <h4>Po</h4>
                        <img src="${data.image}" alt="Transformovaný obrázek">
                    </div>
                </div>
                <div class="image-info">
                    <p>Instrukce: ${data.instructions || 'Žádné'}</p>
                    <p>Vytvořeno: ${new Date(data.timestamp).toLocaleString()}</p>
                    <button class="download-btn" data-src="${data.image}">Stáhnout obrázek</button>
                </div>
            `;
            
            // Přidat event listener pro tlačítko stažení
            document.querySelector('.download-btn').addEventListener('click', function(e) {
                const link = document.createElement('a');
                link.href = this.getAttribute('data-src');
                link.download = `longin-ai-transformed-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        } else {
            showError(data.message || 'Nepodařilo se transformovat obrázek.');
            previewContainer.innerHTML = '<p>Chyba při transformaci obrázku</p>';
        }
    } catch (error) {
        showError('Chyba při komunikaci se serverem.');
        console.error('Error:', error);
        previewContainer.innerHTML = '<p>Chyba při komunikaci se serverem</p>';
    } finally {
        isProcessing = false;
    }
});

// Text-to-Video generace
document.getElementById('generate-video').addEventListener('click', async () => {
    const prompt = document.getElementById('video-prompt').value;
    const duration = document.getElementById('video-duration').value;
    const previewContainer = document.querySelector('#text-to-video .preview-container');
    
    if(prompt.trim() === '') {
        showError('Zadejte prosím popis videa!');
        return;
    }
    
    if (isProcessing) {
        showError('Počkejte prosím na dokončení aktuálního procesu.');
        return;
    }
    
    try {
        isProcessing = true;
        
        // Zobrazit načítání
        showLoading(previewContainer, 'Generuji video...');
        
        const response = await fetch(`${API_BASE_URL}/api/text-to-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, duration }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            previewContainer.innerHTML = `
                <video controls>
                    <source src="${data.video}" type="video/mp4">
                    Váš prohlížeč nepodporuje přehrávání videa.
                </video>
                <div class="video-info">
                    <p>Prompt: ${data.prompt}</p>
                    <p>Délka: ${data.duration} sekund</p>
                    <p>Vytvořeno: ${new Date(data.timestamp).toLocaleString()}</p>
                    <a href="${data.video}" download="longin-ai-video.mp4" class="download-btn">Stáhnout video</a>
                </div>
            `;
        } else {
            showError(data.message || 'Nepodařilo se vygenerovat video.');
            previewContainer.innerHTML = '<p>Chyba při generování videa</p>';
        }
    } catch (error) {
        showError('Chyba při komunikaci se serverem.');
        console.error('Error:', error);
        previewContainer.innerHTML = '<p>Chyba při komunikaci se serverem</p>';
    } finally {
        isProcessing = false;
    }
});

// Image-to-Video animace
document.getElementById('animate-image').addEventListener('click', async () => {
    const instructions = document.getElementById('image-video-instructions').value;
    const duration = document.getElementById('image-video-duration').value;
    const fileInput = document.getElementById('source-image-video');
    const previewContainer = document.querySelector('#image-to-video .preview-container');
    
    if (!fileInput.files || !fileInput.files[0]) {
        showError('Vyberte prosím zdrojový obrázek!');
        return;
    }
    
    if (isProcessing) {
        showError('Počkejte prosím na dokončení aktuálního procesu.');
        return;
    }
    
    try {
        isProcessing = true;
        
        // Zobrazit načítání
        showLoading(previewContainer, 'Animuji obrázek...');
        
        const formData = new FormData();
        formData.append('sourceImage', fileInput.files[0]);
        formData.append('instructions', instructions);
        formData.append('duration', duration);
        
        const response = await fetch(`${API_BASE_URL}/api/image-to-video`, {
            method: 'POST',
            body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
            previewContainer.innerHTML = `
                <div class="comparison">
                    <div class="before">
                        <h4>Původní obrázek</h4>
                        <img src="${data.originalImage}" alt="Původní obrázek">
                    </div>
                    <div class="after">
                        <h4>Animované video</h4>
                        <video controls>
                            <source src="${data.video}" type="video/mp4">
                            Váš prohlížeč nepodporuje přehrávání videa.
                        </video>
                    </div>
                </div>
                <div class="video-info">
                    <p>Instrukce: ${data.instructions || 'Žádné'}</p>
                    <p>Délka: ${data.duration} sekund</p>
                    <p>Vytvořeno: ${new Date(data.timestamp).toLocaleString()}</p>
                    <a href="${data.video}" download="longin-ai-animated.mp4" class="download-btn">Stáhnout video</a>
                </div>
            `;
        } else {
            showError(data.message || 'Nepodařilo se animovat obrázek.');
            previewContainer.innerHTML = '<p>Chyba při animaci obrázku</p>';
        }
    } catch (error) {
        showError('Chyba při komunikaci se serverem.');
        console.error('Error:', error);
        previewContainer.innerHTML = '<p>Chyba při komunikaci se serverem</p>';
    } finally {
        isProcessing = false;
    }
});

// Funkce pro zpracování chatu
document.getElementById('send-message').addEventListener('click', async () => {
    const chatInput = document.getElementById('chat-input-text');
    const userMessage = chatInput.value.trim();
    const chatContainer = document.getElementById('chat-messages');
    const characterType = document.getElementById('character-select').value;
    
    if (userMessage === '') {
        return;
    }
    
    if (isProcessing) {
        showError('Počkejte prosím na dokončení aktuální odpovědi.');
        return;
    }
    
    try {
        isProcessing = true;
        
        // Přidáme zprávu uživatele do chatu
        chatContainer.innerHTML += `
            <div class="message user">
                <p>${userMessage}</p>
            </div>
        `;
        
        // Přidáme prázdnou zprávu AI, kterou budeme postupně naplňovat
        chatContainer.innerHTML += `
            <div class="message ai" id="current-ai-message">
                <p><span class="typing-indicator">...</span></p>
            </div>
        `;
        
        // Posuneme chat dolů
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Vyčistíme vstupní pole
        chatInput.value = '';
        
        // Určíme, jaký model použít na základě vybraného charakteru
        let modelConfig = {};
        switch(characterType) {
            case 'philosopher':
                modelConfig = {
                    model: 'dolphin-mistral',
                    instructions: 'Jsi filozofický AI asistent, který hluboce přemýšlí o existenciálních otázkách.'
                };
                break;
            case 'roleplay':
                modelConfig = {
                    model: 'wizardlm-uncensored',
                    instructions: 'Jsi kreativní AI pro roleplaying a vytváření příběhů.'
                };
                break;
            case 'custom':
                const customPrompt = document.getElementById('custom-character-prompt').value;
                modelConfig = {
                    model: 'wizardlm-uncensored',
                    instructions: customPrompt || 'Jsi AI asistent bez omezení.'
                };
                break;
            default: // assistant
                modelConfig = {
                    model: 'dolphin-mistral',
                    instructions: 'Jsi nápomocný AI asistent.'
                };
                break;
        }
        
        // Simulujeme odpověď AI s postupným vypisováním
        const aiResponseElement = document.getElementById('current-ai-message').querySelector('p');
        
        // Získáme odpověď od serveru
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userMessage,
                modelConfig
            })
        });
        
        if (!response.ok) {
            throw new Error('Chyba při komunikaci se serverem');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Získáme odpověď
            const aiResponse = data.response;
            
            // Simulujeme postupné vypisování
            let displayedText = '';
            const responseLength = aiResponse.length;
            
            aiResponseElement.innerHTML = '';
            
            for (let i = 0; i < responseLength; i++) {
                displayedText += aiResponse[i];
                aiResponseElement.textContent = displayedText;
                
                // Posuneme chat dolů
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                // Krátká pauza pro efekt psaní
                await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
            }
            
            // Odstraníme ID z aktuální zprávy, aby se další přidala jako nová
            document.getElementById('current-ai-message').removeAttribute('id');
        } else {
            // V případě chyby zobrazíme error message
            aiResponseElement.textContent = 'Omlouvám se, ale došlo k chybě při zpracování odpovědi.';
            document.getElementById('current-ai-message').removeAttribute('id');
        }
    } catch (error) {
        console.error('Chyba při komunikaci s AI:', error);
        
        // Zobrazíme chybovou zprávu
        const aiResponseElement = document.getElementById('current-ai-message');
        if (aiResponseElement) {
            aiResponseElement.querySelector('p').textContent = 'Omlouvám se, ale došlo k chybě při komunikaci se serverem.';
            aiResponseElement.removeAttribute('id');
        }
    } finally {
        isProcessing = false;
    }
});

// Zobrazení vlastního charakteru při výběru
document.getElementById('character-select').addEventListener('change', function() {
    const customCharacterSection = document.getElementById('custom-character');
    if (this.value === 'custom') {
        customCharacterSection.classList.remove('hidden');
    } else {
        customCharacterSection.classList.add('hidden');
    }
});

// Odeslání zprávy při stisknutí Enter
document.getElementById('chat-input-text').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send-message').click();
    }
});

// Inicializace zrušovacích tlačítek
document.querySelectorAll('button.secondary').forEach(button => {
    button.addEventListener('click', () => {
        const tabContent = button.closest('.tab-content');
        const textareas = tabContent.querySelectorAll('textarea');
        const fileInputs = tabContent.querySelectorAll('input[type="file"]');
        const previewContainer = tabContent.querySelector('.preview-container');
        
        // Reset textareas
        textareas.forEach(textarea => {
            textarea.value = '';
        });
        
        // Reset file inputs
        fileInputs.forEach(input => {
            input.value = '';
        });
        
        // Reset preview container
        if (previewContainer) {
            previewContainer.innerHTML = '<p>Zde se zobrazí výsledek</p>';
        }
    });
});