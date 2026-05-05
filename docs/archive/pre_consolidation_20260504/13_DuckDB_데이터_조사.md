# 13 DuckDB 데이터 조사

## Goal

LMU `.duckdb` 파일에서 MVP 구현에 필요한 실제 table, event, channel 구조를 read-only로 확인한다.

이 문서는 구현 전에 확인해야 할 데이터 질문 목록과 probe report 형식을 정의한다.

## Required Questions

### Session Metadata

- TrackName은 어디에 저장되는가?
- TrackLayout은 어디에 저장되는가?
- SessionType은 어디에 저장되는가?
- RecordingTime은 어디에 저장되는가?
- CarName은 어디에 저장되는가?
- CarClass는 어디에 저장되는가?
- DriverName은 어디에 저장되는가?

### Car Metadata

- CarName은 어디에 저장되는가?
- CarClass는 어디에 저장되는가?
- Manufacturer / model / year 정보가 있는가?
- 같은 차량이 session마다 같은 이름으로 기록되는가?
- DLC 차량과 base 차량을 구분할 수 있는가?
- 차량별로 telemetry channel 구성이 달라지는가?
- hybrid / regen / fuel / tire 관련 channel이 있는가?

### Session / Event Context

- SessionType은 어디에 저장되는가?
- Practice / Qualifying / Race를 구분할 수 있는가?
- RaceControl Daily / Weekly / Special 여부가 기록되는가?
- Hosted server / offline race weekend 여부가 기록되는가?
- event name 또는 server name이 기록되는가?

### Race Result

- race finish position이 기록되는가?
- class position이 기록되는가?
- grid position이 기록되는가?
- finish status, DNF, DSQ 여부가 기록되는가?
- total laps / completed laps가 기록되는가?
- sector / lap classification이 기록되는가?

### Lap Extraction

- Lap event는 어느 table에 있는가?
- Lap Time event는 어느 table에 있는가?
- lapNumber를 안정적으로 만들 수 있는가?
- invalid lap을 어떻게 구분하는가?
- Lap Time value의 단위는 무엇인가?

### Coordinate Detection

- X/Y 후보 channel이 있는가?
- world position 후보 channel이 있는가?
- GPS latitude/longitude 후보 channel이 있는가?
- channel 이름 패턴은 무엇인가?
- 좌표 값이 한 랩 동안 충분히 변하는가?
- distance와 정렬 가능한가?
- 좌표값의 단위는 meter인가, normalized 값인가, GPS degree인가?

### Graph Channels

- speed channel 이름은 무엇인가?
- brake channel 이름은 무엇인가?
- throttle channel 이름은 무엇인가?
- steering channel 이름은 무엇인가?
- distance channel 이름은 무엇인가?
- 값 범위는 무엇인가?
- 단위는 무엇인가?
- sample count와 frequency는 무엇인가?

### Multi-Track Validation

- trackName / trackLayout metadata는 어디에 있는가?
- track별 coordinate range는 어떻게 다른가?
- layout별 lap distance는 안정적인가?
- 긴 track과 짧은 layout 모두 fit-to-view 가능한가?
- GPS 좌표와 world/position 좌표가 track별로 다르게 존재하는가?
- 같은 trackName에서 다른 TrackLayout이 존재하는가?
- metadata가 없거나 깨져도 좌표 기반 viewer는 동작 가능한가?

## Probe Steps

1. table 목록을 출력한다.
2. 각 table schema를 출력한다.
3. metadata 후보 table의 key/value sample을 출력한다.
4. Lap / Lap Time 후보 table의 row count, min/max, sample을 출력한다.
5. coordinate 후보 channel의 row count, null count, min/max, first 100 samples를 출력한다.
6. speed/brake/throttle/steering/distance 후보 channel의 row count, min/max, first 100 samples를 출력한다.
7. coordinate 후보와 distance 후보의 변화 패턴을 비교한다.
8. 서로 다른 track/layout sample의 coordinate range와 lap distance를 비교한다.
9. Phase readiness를 평가한다.

## Probe Report Type

```ts
type DuckDBProbeReport = {
  filePath: string
  generatedAt: string

  tables: {
    name: string
    columns: {
      name: string
      type: string
      nullCount?: number
      sampleValues?: unknown[]
      min?: number
      max?: number
      variance?: number
    }[]
    rowCount?: number
  }[]

  metadataCandidates: string[]

  carCandidates: {
    carName?: string
    carClass?: string
    manufacturer?: string
    model?: string
    season?: string
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }[]

  eventContextCandidates: {
    sessionType?: string
    eventType?: string
    eventName?: string
    serverName?: string
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }[]

  raceResultCandidates: {
    overallPosition?: string
    classPosition?: string
    gridPosition?: string
    finishStatus?: string
    totalLaps?: string
    completedLaps?: string
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }[]

  lapCandidates: {
    lapNumber?: string
    lapTime?: string
    startTime?: string
    endTime?: string
    validity?: string
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }[]

  distanceCandidates: {
    channel: string
    unitGuess?: 'meter' | 'unknown'
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }[]

  coordinateCandidates: {
    xChannel?: string
    yChannel?: string
    latChannel?: string
    lonChannel?: string
    source: 'gps' | 'world' | 'position' | 'none'
    confidence: 'high' | 'medium' | 'low'
    reason: string
  }[]

  graphChannelCandidates: {
    speed?: string[]
    brake?: string[]
    throttle?: string[]
    steering?: string[]
  }

  phaseReadiness: {
    phase1SingleLapViewer: 'ready' | 'blocked' | 'needs-review'
    phase2BestLapComparison: 'ready' | 'blocked' | 'needs-review'
    phase3GhostReplay: 'ready' | 'blocked' | 'needs-review'
    reason: string
  }

  blockers: string[]
  nextQuestions: string[]
}
```

## Rules

- 실제 table명이나 channel명을 추측하지 않는다.
- probe는 read-only로 동작해야 한다.
- 발견하지 못한 데이터는 "없음" 또는 "미확인"으로 남긴다.
- 좌표 channel이 불확실하면 confidence를 낮게 표시한다.
- schema가 여러 파일에서 다르면 차이를 보고한다.
- Phase 2 이후 기능 가능성도 기록하되 구현하지 않는다.
