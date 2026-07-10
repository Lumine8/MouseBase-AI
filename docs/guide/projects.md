# Projects

Projects group memories and each has its own scoped API key.

## List Projects

`GET /api/v1/projects/`

Returns all projects for the authenticated account.

```bash
curl https://api.mousebase.dev/api/v1/projects/ \
  -H "Authorization: Bearer $MOUSEBASE_API_KEY"
```

## Create Project

`POST /api/v1/projects/`

Creates a new project and returns its API key.

```json
{
  "name": "My Chatbot",
  "description": "Customer support memories"
}
```

```bash
curl -X POST https://api.mousebase.dev/api/v1/projects/ \
  -H "Authorization: Bearer $MOUSEBASE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Chatbot", "description": "Customer support memories"}'
```

## Get Project

`GET /api/v1/projects/{project_id}`

## Update Project

`PATCH /api/v1/projects/{project_id}`

```json
{
  "name": "Renamed Project",
  "description": "Updated description"
}
```

## Delete Project

`DELETE /api/v1/projects/{project_id}`

## Rotate API Key

`POST /api/v1/projects/{project_id}/api-key/rotate`

Generates a new API key. The old key becomes invalid immediately.

```bash
curl -X POST https://api.mousebase.dev/api/v1/projects/proj_abc123/api-key/rotate \
  -H "Authorization: Bearer $MOUSEBASE_API_KEY"
```

## SDK Usage

### Python

```python
# Create
project = client.projects.create(name="My Chatbot", description="Support")
print(project.api_key)  # "mb_live_..."

# List
projects = client.projects.list()

# Get
project = client.projects.get("proj_abc123")

# Update
client.projects.update("proj_abc123", name="Renamed")

# Delete
client.projects.delete("proj_abc123")

# Rotate key
project = client.projects.rotate_key("proj_abc123")
```

### JavaScript

```typescript
const project = await client.projects.create({
  name: "My Chatbot",
  description: "Support",
});
console.log(project.api_key);

const projects = await client.projects.list();
const project = await client.projects.get("proj_abc123");
await client.projects.update("proj_abc123", { name: "Renamed" });
await client.projects.delete("proj_abc123");
await client.projects.rotateKey("proj_abc123");
```
