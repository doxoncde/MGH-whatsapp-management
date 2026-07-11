# Spec-Kit + Command Code Integration — Installation Guide

## Files to Add

### 1. Integration Package
Copy `cmdc/__init__.py` → `src/specify_cli/integrations/cmdc/__init__.py`

### 2. Test File
Copy `test_integration_cmdc.py` → `tests/integrations/test_integration_cmdc.py`

## Files to Modify

### 3. Register Integration — `src/specify_cli/integrations/__init__.py`

Two changes needed:

#### a) Add import (alphabetical, after `claude` and before `cline`):

```python
    from .cmdc import CmcIntegration
```

#### b) Add registration (alphabetical, after `ClaudeIntegration()` and before `ClineIntegration()`):

```python
    _register(CmcIntegration())
```

### 4. Add to Catalog — `integrations/catalog.json`

Add under the `"integrations"` object (alphabetical, after `"claude"` and before `"cline"`):

```json
    "cmdc": {
      "id": "cmdc",
      "name": "Command Code",
      "version": "1.0.0",
      "description": "Command Code CLI skills-based integration",
      "author": "spec-kit-core",
      "repository": "https://github.com/github/spec-kit",
      "tags": ["cli", "skills"]
    },
```

### 5. Update `AGENTS.md` Supported List

Add `--integration cmdc` to the list under both the **Persistent Installation** table and **One-Time Usage** sections.

### 6. Update `README.md`

Add the Command Code row to the supported integrations table.

---

## Verification

```bash
# From the spec-kit repo root:
uv pip install -e .
pytest tests/integrations/test_integration_cmdc.py -v

# Test full init:
uv run specify init /tmp/test-cmdc --integration cmdc --script sh
ls -la /tmp/test-cmdc/.commandcode/skills/speckit-plan/SKILL.md
```

## Usage After Integration

```bash
specify init my-project --integration cmdc
cd my-project
# Then open in cmdc — slash commands like /speckit.specify become available
```
