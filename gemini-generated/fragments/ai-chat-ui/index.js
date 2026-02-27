const messagesContainer = fragmentElement.querySelector('.chat-messages');
const inputField = fragmentElement.querySelector('input');
const sendBtn = fragmentElement.querySelector('button');
const infoEl = fragmentElement.querySelector(`#info-${fragmentEntryLinkNamespace}`);
const errorEl = fragmentElement.querySelector(`#error-${fragmentEntryLinkNamespace}`);

const addMessage = (content, role) => {
    const msgDiv = document.createElement('div');
    const label = role === 'assistant' ? 'Assistant message' : 'Your message';
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = `<div class="bubble" aria-label="${label}">${content}</div>`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

const showTyping = () => {
    const typing = document.createElement('div');
    typing.className = 'message assistant typing-indicator';
    typing.id = 'typing-indicator';
    typing.innerHTML = '<div class="bubble">Assistant is thinking...</div>';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

const hideTyping = () => {
    const typing = fragmentElement.querySelector('#typing-indicator');
    if (typing) typing.remove();
};

const sendMessage = async () => {
    const query = inputField.value.trim();
    if (!query) return;

    if (!configuration.backendUrl && layoutMode === 'view') {
        addMessage('System Error: No backend URL configured.', 'assistant');
        return;
    }

    inputField.value = '';
    addMessage(query, 'user');
    
    if (layoutMode !== 'view') {
        setTimeout(() => addMessage('This is a simulated response for the fragment editor.', 'assistant'), 500);
        return;
    }

    showTyping();

    try {
        const payload = {
            query: query,
            userContext: {
                userId: Liferay.ThemeDisplay.getUserId(),
                groupId: Liferay.ThemeDisplay.getScopeGroupId(),
                languageId: Liferay.ThemeDisplay.getLanguageId()
            }
        };

        const response = await Liferay.Util.fetch(configuration.backendUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        hideTyping();

        if (response.ok) {
            const data = await response.json();
            addMessage(data.answer || 'I could not find an answer.', 'assistant');
        } else {
            addMessage('Error: Failed to connect to the backend.', 'assistant');
        }
    } catch (err) {
        hideTyping();
        addMessage('System Error: Connection failed.', 'assistant');
        console.error('AI Chat Error:', err);
    }
};

const initChat = () => {
    if (layoutMode !== 'view' && !configuration.backendUrl) {
        if (infoEl) {
            infoEl.textContent = 'Please configure a Backend URL in the configuration.';
            infoEl.classList.remove('d-none');
            if (messagesContainer) messagesContainer.classList.add('d-none');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
};

initChat();
