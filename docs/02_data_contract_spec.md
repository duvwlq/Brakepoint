# 02 Data Contract Spec

## 1. Principles

- Phase 1은 LMU `.duckdb`를 읽지만 API와 domain model은 canonical model을 사용한다.
- UI는 raw DuckDB table/channel 이름을 직접 알지 않는다.
- `sessionId`와 `lapId`가 UI의 primary key다.
- `filePath`는 internal/debug field다.
- Distance가 모든 sync의 기본 기준이다.
- 좌표가 없으면 graph-only fallback을 반환한다.

## 2. Common Types

```ts
export type GameId =
  | 'lmu'
  | 'f1-25'
  | 'assetto-corsa'
  | 'assetto-corsa-competizione'
  | 'iracing'
  | 'unknown'

export type DataSourceKind =
  | 'duckdb-file'
  | 'udp-stream'
  | 'shared-memory'
  | 'sdk-memory'
  | 'ibt-file'
  | 'rest-api'
  | 'manual-import'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export type ApiError = {
  code: ApiErrorCode
  message: string
  detail?: string
}

export type ApiErrorCode =
  | 'TELEMETRY_SOURCE_MISSING'
  | 'TELEMETRY_FOLDER_MISSING'
  | 'SOURCE_UNAVAILABLE'
  | 'FILE_UNREADABLE'
  | 'FILE_CORRUPT'
  | 'SESSION_NOT_FOUND'
  | 'LAP_NOT_FOUND'
  | 'LAP_INVALID'
  | 'CHANNEL_MISSING'
  | 'MISSING_DISTANCE'
  | 'ADAPTER_NOT_SUPPORTED'
  | 'UNKNOWN_ERROR'

export type DataWarning = {
  code: DataWarningCode
  message: string
  detail?: string
}

export type DataWarningCode =
  | 'NO_COORDINATES'
  | 'LOW_SAMPLE_COUNT'
  | 'PARTIAL_CHANNELS'
  | 'UNSTABLE_COORDINATES'
  | 'LOW_CONFIDENCE_COORDINATES'
  | 'METADATA_MISSING'
  | 'CHANNEL_MISSING'
  | 'LAP_TIME_MISSING'
  | 'LAP_BOUNDARY_AMBIGUOUS'
```

## 3. Identity Models

```ts
export type TrackIdentity = {
  game: GameId
  rawTrackId?: string
  rawTrackName?: string
  rawLayoutName?: string
  canonicalTrackId?: string
  canonicalLayoutId?: string
  displayName: string
  layoutName?: string
  trackLengthM?: number
  source: 'telemetry' | 'game-api' | 'manual-map' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
}

export type CarIdentity = {
  game: GameId
  rawCarId?: string
  rawCarName?: string
  canonicalCarId?: string
  displayName: string
  carClass?: string
  manufacturer?: string
  model?: string
  season?: string
  source: 'telemetry' | 'game-api' | 'official-catalog' | 'manual-map' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
}
```

## 4. Session and Lap Models

```ts
export type SessionType =
  | 'practice'
  | 'qualifying'
  | 'race'
  | 'test-day'
  | 'unknown'

export type EventType =
  | 'offline-race-weekend'
  | 'racecontrol-daily'
  | 'racecontrol-weekly'
  | 'racecontrol-special'
  | 'racecontrol-championship'
  | 'hosted-server'
  | 'unknown'

export type EventContext = {
  eventType: EventType
  eventName?: string
  serverName?: string
  online?: boolean
  source: 'telemetry-metadata' | 'manual' | 'unknown'
  confidence: 'high' | 'medium' | 'low'
}

export type NormalizedSessionSummary = {
  sessionId: string
  game: GameId
  sourceKind: DataSourceKind
  filePath?: string
  fileName?: string
  modifiedAt?: string
  track: TrackIdentity
  car: CarIdentity
  sessionType: SessionType
  eventContext?: EventContext
  startedAt?: string
  endedAt?: string
  status: 'ready' | 'error' | 'recording' | 'partial'
  warnings: DataWarning[]
}

export type LapKind =
  | 'out-lap'
  | 'flying-lap'
  | 'in-lap'
  | 'race-lap'
  | 'invalid'
  | 'unknown'

export type NormalizedLapSummary = {
  lapId: string
  lapNumber: number
  lapTimeMs: number | null
  isValid: boolean
  isBest: boolean
  lapKind: LapKind
  startTimeMs?: number
  endTimeMs?: number
  distanceM?: number
  validityReason?: string
  warnings: DataWarning[]
}
```

## 5. Telemetry Point

```ts
export type NormalizedTelemetryPoint = {
  sampleIndex: number
  timeMs?: number
  distanceM?: number
  lapProgress?: number
  x?: number
  y?: number
  z?: number
  speedKph?: number
  throttle01?: number
  brake01?: number
  steering01?: number
  steeringAngleDeg?: number
  gear?: number
  rpm?: number
  raw?: {
    sourceChannel?: string
    packetType?: string
  }
}
```

## 6. Sync and Coordinate Status

```ts
export type SyncStatus = {
  preferredAxis: 'distance' | 'time' | 'lap-progress' | 'sample-index'
  hasDistance: boolean
  distanceConfidence: 'high' | 'medium' | 'low' | 'none'
  reason: string
}

export type CoordinateStatus = {
  hasCoordinates: boolean
  source:
    | 'world-xz'
    | 'world-xy'
    | 'gps-lat-lon'
    | 'position-vector'
    | 'none'
  renderMapping:
    | 'x-y'
    | 'x-z'
    | 'gps-projected'
    | 'adapter-projected'
    | 'none'
  confidence: 'high' | 'medium' | 'low' | 'none'
  coordinateUnit:
    | 'meter'
    | 'gps-degree'
    | 'projected-meter'
    | 'normalized'
    | 'unknown'
  reason: string
}
```

## 7. Racing Line View Data

```ts
export type RacingLineViewData = {
  session: NormalizedSessionSummary
  lap: NormalizedLapSummary
  mode: 'real-racing-line' | 'distance-graph-only'
  coordinateStatus: CoordinateStatus
  sync: SyncStatus
  racingLine: RacingLinePoint[]
  graphPoints: TelemetryGraphPoint[]
  warnings: DataWarning[]
}

export type RacingLinePoint = {
  distanceM: number
  x: number
  y: number
  speedKph?: number
  brake01?: number
  throttle01?: number
}

export type TelemetryGraphPoint = {
  distanceM: number
  speedKph?: number
  brake01?: number
  throttle01?: number
  steering01?: number
  gear?: number
  rpm?: number
}
```

`graphPoints`는 partial channel에 안전해야 한다.
예를 들어 brake channel이 없으면 `brake01`만 생략하고 `PARTIAL_CHANNELS` warning을 반환한다.
Speed/Brake/Throttle 배열을 서로 다른 길이로 따로 반환하지 않는다.

## 8. Renderer API

```ts
export type GameDataSource = {
  sourceId: string
  game: GameId
  sourceKind: DataSourceKind
  displayName: string
  path?: string
  status: 'ready' | 'missing' | 'unavailable' | 'recording' | 'unknown'
  warnings: DataWarning[]
}

export type TelemetryFolderStatus = {
  path?: string
  exists: boolean
  fileCount?: number
  warnings: DataWarning[]
}

export type NormalizedSessionDetail = {
  session: NormalizedSessionSummary
  laps: NormalizedLapSummary[]
  warnings: DataWarning[]
}

window.brakepointApi = {
  getGameCapabilities(game: GameId): Promise<ApiResult<GameCapabilities>>
  detectSources(game: GameId): Promise<ApiResult<GameDataSource[]>>
  getTelemetryFolderStatus(sourceId?: string): Promise<ApiResult<TelemetryFolderStatus>>
  listSessions(sourceId?: string): Promise<ApiResult<NormalizedSessionSummary[]>>
  loadSession(sessionId: string): Promise<ApiResult<NormalizedSessionDetail>>
  loadLapRacingLine(sessionId: string, lapId: string): Promise<ApiResult<RacingLineViewData>>
}
```

## 9. Game Adapter Contract

```ts
export type NormalizedLapTelemetry = {
  game: GameId
  session: NormalizedSessionSummary
  lap: NormalizedLapSummary
  sync: SyncStatus
  coordinateStatus: CoordinateStatus
  points: NormalizedTelemetryPoint[]
  warnings: DataWarning[]
}

export type CapabilityStatus =
  | 'supported'
  | 'partial'
  | 'not-supported'
  | 'unknown'

export type GameCapabilities = {
  sourceKind: DataSourceKind[]
  supportsPostSessionImport: boolean
  supportsLiveCapture: boolean
  telemetry: {
    speed: CapabilityStatus
    brake: CapabilityStatus
    throttle: CapabilityStatus
    steering: CapabilityStatus
    rpm: CapabilityStatus
    gear: CapabilityStatus
    coordinates: CapabilityStatus
    distance: CapabilityStatus
    lapTimes: CapabilityStatus
    sectorTimes: CapabilityStatus
  }
  context: {
    track: CapabilityStatus
    layout: CapabilityStatus
    car: CapabilityStatus
    carClass: CapabilityStatus
    sessionType: CapabilityStatus
    raceResult: CapabilityStatus
    participants: CapabilityStatus
    weather: CapabilityStatus
    tyre: CapabilityStatus
    fuel: CapabilityStatus
  }
}

export type GameProbeReport = {
  sourceId: string
  generatedAt: string
  findings: string[]
  blockers: string[]
  warnings: DataWarning[]
}

export type GameAdapter = {
  gameId: GameId
  displayName: string
  detectSources(): Promise<GameDataSource[]>
  probe(source: GameDataSource): Promise<GameProbeReport>
  listSessions(source: GameDataSource): Promise<NormalizedSessionSummary[]>
  loadSession(source: GameDataSource, sessionId: string): Promise<NormalizedSessionDetail>
  loadLapTelemetry(
    source: GameDataSource,
    sessionId: string,
    lapId: string
  ): Promise<NormalizedLapTelemetry>
  getCapabilities(): GameCapabilities
}
```

Phase 1 구현 대상:

- `lmuDuckdbAdapter`

구현 금지:

- `f1UdpAdapter`
- `assettoSharedMemoryAdapter`
- `accAdapter`
- `iracingSdkAdapter`

## 10. LMU DuckDB Probe Summary

샘플 probe에서 확인된 구조:

- `metadata`
- `channelsList`
- `eventsList`
- channel/event 별도 table
- channel table은 대부분 `value` only
- event table은 `ts`, `value`

Phase 1 핵심 후보:

- 좌표: `GPS Latitude`, `GPS Longitude`
- Distance: `Lap Dist`
- Speed: `Ground Speed`
- RPM: `Engine RPM`
- Brake: `Brake Pos`
- Throttle: `Throttle Pos`
- Steering: `Steering Pos`
- Lap boundary: `Lap`
- Lap time: `Lap Time`
- Pit context: `In Pits`

주의:

- 채널 frequency가 다르다.
- channel table에는 공통 timestamp가 없다.
- Phase 1에서는 좌표/distance 채널을 기준으로 lap-local data를 구성해야 한다.

## 11. Coordinate Detection

우선순위:

1. World/position X/Z 또는 X/Y pair
2. GPS Latitude/Longitude pair
3. none

LMU 샘플 기준:

- `GPS Latitude` + `GPS Longitude`가 사용 가능한 좌표 후보로 확인됨
- 단, 실제 지구 GPS인지 game-projected 좌표인지는 UI에서 확정적으로 표현하지 않는다
- LMU adapter가 위경도를 lap-local planar `x/y`로 투영해 `RacingLinePoint`를 만들면
  `renderMapping: 'gps-projected'`, `coordinateUnit: 'projected-meter'`로 표시한다

Confidence:

- High: pair 존재, sample count 충분, 값 변화 안정, distance와 정렬 가능
- Medium: pair 존재, 일부 missing/jump 있음
- Low: 변화량 부족 또는 sample 불안정
- None: 좌표 없음

## 12. Fallback Policy

- Coordinates none: `distance-graph-only`
- Distance none: `MISSING_DISTANCE`
- Speed missing: graph warning, racing line 가능하면 표시
- Brake/Throttle missing: 해당 channel warning
- Metadata missing: unknown 표시
- Car/track unknown: analysis 가능하면 계속 진행

## 13. Open Data Questions

- GPS 좌표는 모든 LMU telemetry 설정에서 항상 기록되는가?
- Practice file의 Lap event와 Lap Time event mismatch를 어떻게 안정화할 것인가?
- Race result와 class position이 DuckDB에 있는가?
- 차량별 추가 channel 차이가 Phase 1 구현에 영향을 주는가?
## 14. Electron-Python Bridge Error Policy

Phase 1 uses Electron Main `child_process` to call the validated Python LMU
adapter CLI.

Bridge-specific errors are converted to `ApiResult` error responses before they
reach the renderer.

```ts
export type BridgeErrorCode =
  | 'PYTHON_NOT_FOUND'
  | 'PYTHON_SCRIPT_FAILED'
  | 'PYTHON_JSON_PARSE_FAILED'
  | 'PYTHON_TIMEOUT'
```

Renderer rules:

- Renderer must call only `window.brakepointApi`.
- Renderer must not spawn Python directly.
- Renderer must not read filesystem telemetry files directly.
- Renderer must not know DuckDB table/channel names.

Bridge stdout/stderr rules:

- Python stdout must be JSON only.
- Python stderr is debug/error detail.
- Non-JSON stdout is `PYTHON_JSON_PARSE_FAILED`.
- Non-zero Python exit code is `PYTHON_SCRIPT_FAILED` unless a valid JSON
  `ApiResult` error can be returned.
- Timeout is `PYTHON_TIMEOUT`.
