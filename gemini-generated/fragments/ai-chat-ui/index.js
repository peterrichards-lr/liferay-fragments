const state = {
  history: [],
};

const appendMessage = (text, role) => {
  const container = fragmentElement.querySelector(
    `#messages-${fragmentEntryLinkNamespace}`,
  );
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;
  msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
};

const sendMessage = async () => {
  const input = fragmentElement.querySelector(
    `#input-${fragmentEntryLinkNamespace}`,
  );
  const btn = fragmentElement.querySelector(
    `#send-${fragmentEntryLinkNamespace}`,
  );
  if (!input || !btn) return;

  const query = input.value.trim();

  if (query) {
    input.value = "";
    input.disabled = true;
    btn.disabled = true;

    appendMessage(query, "user");

    // Mock AI Response for prototype
    setTimeout(() => {
      const response = `I'm a prototype assistant. You asked: "${query}". In a real implementation, I would connect to a Liferay-hosted AI endpoint.`;
      appendMessage(response, "assistant");
      input.disabled = false;
      btn.disabled = false;
      input.focus();
    }, 1000);
  }
};

const initChat = () => {
  const input = fragmentElement.querySelector(
    `#input-${fragmentEntryLinkNamespace}`,
  );
  const btn = fragmentElement.querySelector(
    `#send-${fragmentEntryLinkNamespace}`,
  );

  if (input && btn) {
    btn.onclick = sendMessage;
    input.onkeypress = (e) => {
      if (e.key === "Enter") sendMessage();
    };
  }
};

initChat();
