# 01 MVP Spec

## 1. MVP Goal

Brakepoint Phase 1 MVP는 Le Mans Ultimate `.duckdb` telemetry에서 단일 유효 랩을 로드해 실제 주행 라인과 Speed/Brake/Throttle 흐름을 distance 기준으로 보여주는 것이다.

MVP는 Single Lap Viewer지만 Single Track Viewer가 아니다.
좌표가 있는 모든 LMU track/layout은 hardcoded track map 없이 fit-to-view로 표시되어야 한다.

## 2. Target User

- LMU에서 주행 후 자신의 랩을 빠르게 확인하고 싶은 sim racer
- MoTeC 수준의 복잡한 분석보다 “내가 어떻게 달렸는지”를 먼저 보고 싶은 사용자
- 향후 Best Lap 비교와 coach 기능을 기대하지만, 첫 단계에서는 실제 racing line 확인이 필요한 사용자

## 3. In Scope

### MVP-001. Telemetry Folder Status

- 기본 LMU telemetry folder 존재 여부 확인
- `.duckdb` file count 표시
- missing folder면 명확한 안내 표시

### MVP-002. Session Discovery

- `.duckdb` 파일만 session으로 표시
- `.duckdb.wal` 무시
- 최신 수정일 기준 정렬
- 읽기 실패 파일은 session item error로 표시하고 앱 전체는 실패하지 않음

### MVP-003. Session Metadata

표시 대상:

- TrackName
- TrackLayout
- SessionType
- RecordingTime
- CarName
- CarClass
- DriverName
- WeatherConditions 가능 시 표시

### MVP-004. Lap List

- Lap event와 Lap Time event 기반 lap list 생성
- Lap Time이 없거나 0 이하이면 invalid
- valid lap 중 best lap 표시
- invalid lap은 선택 불가

### MVP-005. Coordinate Detection

- 좌표 후보 채널 탐지
- Phase 1 LMU 샘플 기준 `GPS Latitude` + `GPS Longitude`는 high confidence 후보
- 좌표 신뢰도 표시
- 좌표가 없으면 fallback

### MVP-006. Single Lap Racing Line Viewer

- selected valid lap의 racing line 표시
- 전체 라인이 canvas 안에 들어오도록 fit-to-view
- 좌표 범위 hardcoding 금지
- track preset 없이 telemetry 좌표만으로 표시

### MVP-007. Graphs

- Speed
- Brake
- Throttle
- X-axis는 distance
- graph는 racing line의 보조 증거

### MVP-008. Hover Sync

- canvas hover와 graph hover는 distance 기준으로 동기화
- tooltip에는 distance, speed, brake, throttle 표시

### MVP-009. Fallback

- 좌표 없음: `distance-graph-only`
- distance 없음: lap racing line load 실패
- 일부 graph channel 없음: 가능한 데이터 표시 + warning

## 4. Out of Scope

MVP에서 구현하지 않는다.

- Best Lap comparison
- Ghost car
- Delta time
- Coach insight
- AI
- Heatmap
- 자동 segment/corner detection
- Focus Zone
- SVG 기반 실제 트랙맵
- Race Records tab
- F1 25 / Assetto Corsa / iRacing adapter

## 5. Functional Requirements

### FR-001. Telemetry Source Detection

LMU telemetry folder를 찾고 source 상태를 반환한다.

완료 조건:

- folder exists true/false 반환
- fileCount 반환
- missing source error는 앱 crash 없이 표시

### FR-002. Session List

LMU `.duckdb` 파일 목록을 session list로 표시한다.

완료 조건:

- `.wal` 제외
- 최신순 정렬
- unreadable file은 item-level error

### FR-003. Metadata Extraction

metadata table에서 session context를 읽는다.

완료 조건:

- track/layout/car/session type 표시
- 없는 값은 unknown 처리
- raw metadata 추측 금지

### FR-004. Lap Extraction

Lap event와 Lap Time event를 기준으로 lap을 추출한다.

완료 조건:

- valid/invalid 분리
- Lap Time <= 0 invalid
- best lap 표시

### FR-005. Coordinate Detection

usable coordinate pair를 찾는다.

완료 조건:

- coordinate status 반환
- high/medium/low/none confidence
- 좌표 없음 fallback

### FR-006. Racing Line View Data

selected lap을 `RacingLineViewData`로 변환한다.

완료 조건:

- `mode: real-racing-line` 또는 `distance-graph-only`
- racingLine은 x/y/distanceM/speedKph/brake01/throttle01 포함
- graph data는 partial channel에 안전한 `TelemetryGraphPoint[]` 구조
- graph point는 distanceM 기준 정렬

### FR-007. Canvas Fit-To-View

좌표 범위를 계산해 전체 racing line이 화면 안에 보이게 한다.

완료 조건:

- track별 hardcoded scale 없음
- 긴 트랙/짧은 레이아웃 모두 표시
- aspect ratio 유지

### FR-008. Error and Warning Policy

데이터 부족은 가능한 범위에서 fallback으로 처리한다.

완료 조건:

- no coordinates -> graph-only
- no distance -> error
- missing optional channels -> warning

## 6. Core User Flow

1. 앱 실행
2. LMU telemetry source 확인
3. session list 표시
4. session 선택
5. metadata/lap list 표시
6. valid lap 선택
7. coordinate detection 실행
8. racing line 또는 fallback 표시
9. hover로 canvas와 graph 동기화

## 7. Acceptance Criteria

### AT-001. Folder Missing

Given LMU telemetry folder가 없다.
When 앱을 실행한다.
Then 사용자는 folder missing 상태를 볼 수 있고 앱은 종료되지 않는다.

### AT-002. Session List

Given telemetry folder에 `.duckdb` 파일이 있다.
When session list를 로드한다.
Then `.duckdb.wal`은 제외되고 최신순으로 session이 표시된다.

### AT-003. File Read Failure

Given 손상되었거나 읽을 수 없는 `.duckdb` 파일이 있다.
When session list를 로드한다.
Then 앱은 종료되지 않고 해당 파일만 error 상태로 표시한다.

### AT-004. Metadata Display

Given metadata에 track/layout/car/session type이 있다.
When session detail을 연다.
Then 사용자는 해당 정보를 볼 수 있다.

### AT-005. Lap List

Given Lap event와 Lap Time event가 있다.
When session detail을 연다.
Then valid/invalid lap list가 표시된다.

### AT-006. Invalid Lap Disabled

Given Lap Time이 없거나 0 이하인 lap이 있다.
When lap list를 표시한다.
Then invalid lap은 선택할 수 없다.

### AT-007. Racing Line Viewer

Given 좌표가 있는 valid lap이 있다.
When lap을 선택한다.
Then 전체 racing line이 canvas 안에 표시된다.

### AT-008. Distance Graph Only

Given 좌표는 없지만 distance/speed/brake/throttle이 있다.
When lap을 선택한다.
Then racing line 대신 fallback message와 graph가 표시된다.

### AT-009. Hover Sync

Given Racing Line Viewer가 표시되어 있다.
When canvas 또는 graph를 hover한다.
Then 동일 distance 위치가 다른 view에도 표시된다.

### AT-010. Multi-Track Fit

Given 서로 다른 LMU track/layout telemetry가 있다.
When valid lap을 선택한다.
Then hardcoded track map 없이 각 lap racing line이 fit-to-view로 표시된다.
