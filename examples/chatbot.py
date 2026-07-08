"""Chatbot with conversation memory using MouseBase."""

from mousebase import MouseBase

client = MouseBase(api_key="mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E")

SESSION_ID = "session_001"


def chat(user_message: str) -> str:
    # Store the user message
    client.remember(
        user_message,
        external_id=SESSION_ID,
        metadata={"role": "user", "session": SESSION_ID},
    )

    # Retrieve relevant conversation history
    history = client.search(
        user_message,
        top_k=5,
    )

    # Build context from past memories
    context = "\n".join(
        f"User: {r.content}" for r in history
    )

    # In a real app, you'd call an LLM here with the context
    response = (
        f"[AI response based on context]\n"
        f"Found {len(history)} relevant past messages.\n"
        f"Context:\n{context}"
    )

    # Store the assistant response
    client.remember(
        response,
        external_id=SESSION_ID,
        metadata={"role": "assistant", "session": SESSION_ID},
    )

    return response


if __name__ == "__main__":
    print(chat("Hi, I need help with my account."))
    print("---")
    print(chat("I forgot my password."))
