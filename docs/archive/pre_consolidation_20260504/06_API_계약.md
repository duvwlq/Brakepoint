# 06 API 계약

## 1. 원칙

- Renderer는 Electron preload를 통해서만 데이터를 요청한다.
- Renderer는 file system, DuckDB, UDP, shared memory, SDK에 직접 접근하지 않는다.
- 모든 API는 `ApiResult<T>` 형태로 성공/실패를 반환한다.
- API 응답은 게임별 raw schema가 아니라 Brakepoint canonical model을 사용한다.
- Phase 1 구현 대상은 LMU `.duckdb`지만 API 모양은 향후 Game Adapter 확장을 막지 않아야 한다.
- 좌표가 없다는 이유만으로 lap load 전체를 실패시키지 않는다. 가능한 graph data가 있으면 `distance-graph-only` mode로 반환한다.

## 2. Common Response

```ts
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
```

## 3. API Surface

Renderer에 노출되는 API는 아래 형태를 따른다.

```ts
window.brakepointApi = {
  getGameCapabilities(game: GameId): Promise<ApiResult<GameCapabilities>>

  detectSources(game: GameId): Promise<ApiResult<GameDataSource[]>>

  getTelemetryFolderStatus(
    sourceId?: string
  ): Promise<ApiResult<TelemetryFolderStatus>>

  listSessions(
    sourceId?: string
  ): Promise<ApiResult<NormalizedSessionSummary[]>>

  loadSession(
    sessionId: string
  ): Promise<ApiResult<NormalizedSessionDetail>>

  loadLapRacingLine(
    sessionId: string,
    lapId: string
  ): Promise<ApiResult<RacingLineViewData>>
}
```

Phase 1에서는 `detectSources`, `listSessions`, `loadSession`, `loadLapRacingLine`이 `lmuDuckdbAdapter`를 통해 동작한다.

## 4. GameDataSource

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
```

Phase 1 LMU 예시:

```ts
{
  sourceId: 'lmu-telemetry-folder',
  game: 'lmu',
  sourceKind: 'duckdb-file',
  displayName: 'Le Mans Ultimate Telemetry Folder',
  path: 'E:/SteamLibrary/steamapps/common/Le Mans Ultimate/UserData/Telemetry',
  status: 'ready',
  warnings: []
}
```

## 5. getGameCapabilities

### Behavior

- 지정한 game adapter가 현재 제공할 수 있는 데이터와 기능을 반환한다.
- Phase 1에서는 `lmu`만 실제 구현 대상이다.
- F1 25, Assetto Corsa, iRacing 등은 Phase 7 전까지 `unknown` 또는 `not-supported`로 남긴다.

### Success

```ts
{
  ok: true,
  data: {
    sourceKind: ['duckdb-file'],
    supportsPostSessionImport: true,
    supportsLiveCapture: false,
    telemetry: {
      speed: 'supported',
      brake: 'supported',
      throttle: 'supported',
      steering: 'supported',
      coordinates: 'supported',
      distance: 'supported',
      lapTimes: 'supported'
    }
  }
}
```

## 6. detectSources

### Behavior

- Game Adapter가 사용할 수 있는 데이터 source를 찾는다.
- LMU Phase 1에서는 telemetry folder 존재 여부를 확인한다.
- Renderer는 직접 폴더를 스캔하지 않는다.

### Failure

```ts
{
  ok: false,
  error: {
    code: 'TELEMETRY_SOURCE_MISSING',
    message: 'No telemetry source was found for Le Mans Ultimate.'
  }
}
```

## 7. getTelemetryFolderStatus

### Behavior

- LMU Phase 1 convenience API다.
- 내부적으로는 `detectSources('lmu')` 결과를 folder 상태로 표현한다.
- 향후 multi-game에서는 source status API로 통합할 수 있다.

### Success

```ts
{
  ok: true,
  data: {
    path: 'E:/SteamLibrary/steamapps/common/Le Mans Ultimate/UserData/Telemetry',
    exists: true,
    fileCount: 89
  }
}
```

## 8. listSessions

### Behavior

- sourceId가 없으면 Phase 1 기본 LMU telemetry folder를 사용한다.
- `.duckdb` 파일만 반환한다.
- `.duckdb.wal` 파일은 무시한다.
- 최신 수정일 기준 내림차순으로 정렬한다.
- 읽을 수 없는 파일은 앱 전체 실패가 아니라 해당 session item의 `status: 'error'`로 표시한다.
- 반환 타입은 `NormalizedSessionSummary[]`다.

### Success

```ts
{
  ok: true,
  data: [
    {
      sessionId: 'stable-session-id',
      game: 'lmu',
      sourceKind: 'duckdb-file',
      filePath: 'E:/.../Sebring_R_2026-05-03T14_09_58Z.duckdb',
      fileName: 'Sebring_R_2026-05-03T14_09_58Z.duckdb',
      modifiedAt: '2026-05-03T14:09:58Z',
      track: {
        game: 'lmu',
        rawTrackName: 'Sebring International Raceway',
        rawLayoutName: 'Sebring School Circuit',
        displayName: 'Sebring International Raceway',
        layoutName: 'Sebring School Circuit',
        source: 'telemetry',
        confidence: 'high'
      },
      car: {
        game: 'lmu',
        rawCarName: '...',
        displayName: '...',
        carClass: 'LMGT3',
        source: 'telemetry',
        confidence: 'high'
      },
      sessionType: 'race',
      status: 'ready',
      warnings: []
    }
  ]
}
```

## 9. loadSession

### Behavior

- `sessionId`로 session을 로드한다.
- metadata를 canonical identity로 정규화한다.
- Lap event와 Lap Time event를 기준으로 lap list를 만든다.
- Lap Time이 없거나 0 이하인 lap은 invalid 처리한다.
- valid lap 중 가장 빠른 lap을 `isBest: true`로 표시한다.

### Response Type

```ts
export type NormalizedSessionDetail = {
  session: NormalizedSessionSummary
  laps: NormalizedLapSummary[]
  warnings: DataWarning[]
}
```

### Success

```ts
{
  ok: true,
  data: {
    session: NormalizedSessionSummary,
    laps: NormalizedLapSummary[],
    warnings: []
  }
}
```

### Failure

```ts
{
  ok: false,
  error: {
    code: 'FILE_CORRUPT',
    message: 'The telemetry file appears to be corrupted.'
  }
}
```

## 10. loadLapRacingLine

### Behavior

- `sessionId`와 `lapId`로 valid lap telemetry를 로드한다.
- 좌표 채널을 탐지한다.
- LMU Phase 1에서는 `GPS Latitude` + `GPS Longitude`가 high confidence 후보로 확인되었지만, 구현은 probe 결과를 기준으로 일반화해야 한다.
- 좌표가 있으면 `mode: 'real-racing-line'`으로 racing line을 반환한다.
- 좌표가 없지만 distance/speed/brake/throttle이 있으면 `mode: 'distance-graph-only'`로 graph data와 warning을 반환한다.
- distance가 없으면 `MISSING_DISTANCE` error를 반환한다.

### Real Racing Line Response

```ts
{
  ok: true,
  data: {
    session: NormalizedSessionSummary,
    lap: NormalizedLapSummary,
    mode: 'real-racing-line',
    coordinateStatus: {
      hasCoordinates: true,
      source: 'gps-lat-lon',
      renderMapping: 'gps-projected',
      confidence: 'high',
      coordinateUnit: 'gps-degree',
      reason: 'Stable GPS Latitude/Longitude pair found.'
    },
    racingLine: [
      {
        distance: 0,
        x: 10.5,
        y: 20.2,
        speedKph: 81.2,
        brake: 0,
        throttle: 0.2
      }
    ],
    graphs: {
      distance: [0, 1, 2],
      speedKph: [80, 82, 84],
      brake: [0, 0, 0],
      throttle: [0.2, 0.3, 0.4]
    },
    warnings: []
  }
}
```

### Distance Graph Only Response

```ts
{
  ok: true,
  data: {
    session: NormalizedSessionSummary,
    lap: NormalizedLapSummary,
    mode: 'distance-graph-only',
    coordinateStatus: {
      hasCoordinates: false,
      source: 'none',
      renderMapping: 'none',
      confidence: 'none',
      coordinateUnit: 'unknown',
      reason: 'No usable XY/GPS coordinate channels were found.'
    },
    racingLine: [],
    graphs: {
      distance: [0, 1, 2],
      speedKph: [80, 82, 84],
      brake: [0, 0.1, 0.2],
      throttle: [0.2, 0.1, 0]
    },
    warnings: [
      {
        code: 'NO_COORDINATES',
        message: 'No coordinate channels were found, so the racing line cannot be displayed.'
      }
    ]
  }
}
```

## 11. API Boundary Rules

- `filePath`는 API 내부 구현과 debug용 field로만 사용한다. Renderer의 primary key는 `sessionId`다.
- UI는 `GPS Latitude`, `Lap Dist`, `Brake Pos` 같은 raw channel 이름에 의존하지 않는다.
- Raw channel 이름은 warning/detail/debug 영역에만 노출할 수 있다.
- Adapter가 반환하는 telemetry는 `NormalizedLapTelemetry` 또는 `RacingLineViewData`로 변환되어야 한다.
- Phase 1에서 comparison, ghost, coach API는 만들지 않는다.
