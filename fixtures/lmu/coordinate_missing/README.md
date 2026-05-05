# Coordinate Missing Fixture Mode

Brakepoint does not store a modified `.duckdb` copy for coordinate-missing tests.

Instead, use the dev-only adapter fixture mode:

```powershell
$env:BRAKEPOINT_LMU_FIXTURE_MODE="no-coordinates"
python scripts\brakepoint_lmu.py load-lap lmu-877d18c4cdf06bcd lap-1
```

Expected:

- `mode: "distance-graph-only"`
- `racingLine: []`
- `graphPoints` remain available when distance and graph channels exist
- warning code includes `NO_COORDINATES`
- no fake racing line or fake track map is generated
