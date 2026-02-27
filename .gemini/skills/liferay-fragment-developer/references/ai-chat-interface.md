# AI Assistant Integration Interface

## Interface Specification
Fragments providing AI Chat capabilities expect a backend (Client Extension) adhering to this interface:

## Request Structure (POST)
```json
{
  "query": "The user message",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "userContext": {
    "userId": "123",
    "groupId": "456",
    "languageId": "en_US"
  }
}
```

## Response Structure (JSON)
```json
{
  "answer": "The response from the AI",
  "status": "success",
  "metadata": {
    "sources": [
      {"title": "Docs", "url": "https://..."}
    ]
  }
}
```
