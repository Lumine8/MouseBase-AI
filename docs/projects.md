# Projects

Projects organize memories under a single API key.

## Endpoints

### List projects

```
GET /api/v1/projects/
```

### Get a project

```
GET /api/v1/projects/{project_id}
```

### Create a project

```
POST /api/v1/projects/
```

```json
{
  "name": "My Project",
  "description": "Optional description"
}
```

The API key is returned only on creation.

### Update a project

```
PATCH /api/v1/projects/{project_id}
```

### Delete a project

```
DELETE /api/v1/projects/{project_id}
```

### Rotate API key

```
POST /api/v1/projects/{project_id}/api-key/rotate
```

Generates a new key. The old key is immediately invalidated.

## Python SDK

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")

# List
projects = client.list_projects()

# Create
project = client.create_project("My App", description="App memory")
print(project.api_key)  # Shown once

# Rotate
new_key = client.rotate_key(project.id)
```
