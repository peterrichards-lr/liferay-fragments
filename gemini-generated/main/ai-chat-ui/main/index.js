const initAIChatUI = () => {
  const container = fragmentElement.querySelector(
    `#messages-${fragmentEntryLinkNamespace}`
  );
  const input = fragmentElement.querySelector(
    `#input-${fragmentEntryLinkNamespace}`
  );
  const btn = fragmentElement.querySelector(
    `#send-${fragmentEntryLinkNamespace}`
  );

  const appendMessage = (text, role) => {
    if (container) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `message ${role}`;
      msgDiv.setAttribute('role', 'listitem');

      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.textContent = text; // Safer than innerHTML

      msgDiv.appendChild(bubble);
      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;

      // Accessibility: Ensure new messages are announced if container has aria-live
    }
  };

  const sendMessage = async () => {
    if (!input || !btn) return;

    const query = input.value.trim();

    if (query) {
      input.value = '';
      input.disabled = true;
      btn.disabled = true;

      appendMessage(query, 'user');

      // Mock AI Response for prototype
      setTimeout(() => {
        const response = `I'm a prototype assistant. You asked: "${query}". In a real implementation, I would connect to a Liferay-hosted AI endpoint.`;
        appendMessage(response, 'assistant');
        input.disabled = false;
        btn.disabled = false;
        input.focus();
      }, 1000);
    }
  };

  if (input && btn) {
    btn.onclick = sendMessage;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (container) {
    container.setAttribute('role', 'list');
    container.setAttribute('aria-live', 'polite');
  }
};

initAIChatUI();
