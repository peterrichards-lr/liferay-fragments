const messagesContainer = fragmentElement.querySelector('.chat-messages');
const inputField = fragmentElement.querySelector('input');
const sendBtn = fragmentElement.querySelector('button');

const addMessage = (content, role) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = `<div class="bubble">${content}</div>`;
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        hideTyping();

        if (response.ok) {
            const data = await response.json();
            addMessage(data.answer || 'I could not find an answer.', 'assistant');
        } else {
            addMessage('Sorry, I encountered an error connecting to my brain.', 'assistant');
        }
    } catch (err) {
        hideTyping();
        console.error('AI Chat failed:', err);
        addMessage('System Error: Connection failed.', 'assistant');
    }
};

sendBtn.addEventListener('click', sendMessage);
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
