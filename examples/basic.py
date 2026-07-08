"""Basic CRUD operations with MouseBase."""

from mousebase import MouseBase

client = MouseBase(api_key="mb_live_ZbqFJSTeqGsxQUFT_C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E")

# Store a memory
result = client.remember("The user prefers dark mode.")
print(f"Created: {result.id}")

# Search for it
results = client.search("user preferences")
for r in results:
    print(f"  [{r.score:.2f}] {r.content}")

# Update it
client.update_memory(result.id, content="The user prefers system theme.")

# Get it
memory = client.get_memory(result.id)
print(f"Updated: {memory.content}")

# Delete it
client.delete_memory(result.id)
print("Deleted.")
