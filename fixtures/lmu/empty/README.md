# Empty Folder Fixture

This folder intentionally contains no `.duckdb` files.

Use it with:

```powershell
$env:BRAKEPOINT_LMU_TELEMETRY_PATH="fixtures\\lmu\\empty"
python scripts\brakepoint_lmu.py folder-status
python scripts\brakepoint_lmu.py list-sessions
```

Expected:

- `folder-status` returns `exists: true`
- `fileCount: 0`
- `list-sessions` returns an empty session list without crashing
