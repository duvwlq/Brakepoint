# Corrupt File Fixture

This folder contains a tiny dummy file with a `.duckdb` extension so the adapter
can exercise unreadable/corrupt file handling without touching raw telemetry.

Use it with:

```powershell
$env:BRAKEPOINT_LMU_TELEMETRY_PATH="fixtures\\lmu\\corrupt"
python scripts\brakepoint_lmu.py list-sessions
```

Expected:

- session discovery does not crash
- `broken.duckdb` appears as an item-level error
- the error code is `FILE_CORRUPT` or `FILE_UNREADABLE`
