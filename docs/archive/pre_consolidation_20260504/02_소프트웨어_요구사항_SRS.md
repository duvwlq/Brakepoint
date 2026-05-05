# 02 소프트웨어 요구사항 SRS

## 1. 목적

Brakepoint MVP는 Le Mans Ultimate telemetry `.duckdb` 파일을 읽어 사용자의 실제 단일 랩 주행 라인을 시각화한다.

핵심 목표는 그래프 뷰어가 아니라 "내가 트랙을 어떻게 돌았는지 한눈에 보는 도구"를 만드는 것이다.

## 2. 사용자 역할

### User

LMU telemetry 파일을 가진 일반 사용자.

## 3. 기능 요구사항

### FR-001. Telemetry Folder Status

- 설명: 기본 LMU telemetry 폴더의 존재 여부와 접근 가능 여부를 확인한다.
- 정상 흐름: 앱이 기본 폴더를 확인하고 상태를 표시한다.
- 예외 흐름: 폴더가 없으면 경로 안내와 fallback 상태를 표시한다.
- 완료 조건: 폴더 경로, 존재 여부, 파일 수가 표시된다.
- 관련 데이터: `TelemetryFolderStatus`

### FR-002. Session Discovery

- 설명: telemetry 폴더에서 `.duckdb` 파일을 찾는다.
- 정상 흐름: `.duckdb` 파일을 최신순으로 표시한다.
- 예외 흐름: 읽기 실패 파일은 앱 전체 실패가 아니라 해당 session item error로 표시한다.
- 완료 조건: `.duckdb.wal` 제외, 최신순 정렬, error file 상태 표시.
- 관련 API: `listSessions`

### FR-003. Metadata Extraction

- 설명: 각 `.duckdb` 파일의 metadata를 읽어 session 정보를 만든다.
- 정상 흐름: TrackName, TrackLayout, SessionType, CarName 등 가능한 값을 표시한다.
- 예외 흐름: 일부 metadata가 없으면 가능한 값만 표시하고 warning을 남긴다.
- 완료 조건: session card에 핵심 metadata가 표시된다.
- 관련 데이터: `SessionMetadata`

### FR-004. Lap Extraction

- 설명: Lap event와 Lap Time event를 기준으로 lap list를 만든다.
- 정상 흐름: valid lap 목록과 best lap을 표시한다.
- 예외 흐름: Lap Time이 없거나 0 이하이면 invalid 처리한다.
- 완료 조건: valid / invalid / best 상태가 표시된다.
- 관련 데이터: `LapSummary`

### FR-005. Coordinate Channel Detection

- 설명: XY/GPS 좌표 후보 channel을 탐색하고 실제 racing line 사용 가능 여부를 판단한다.
- 정상 흐름: 좌표 channel을 찾고 confidence를 계산한다.
- 예외 흐름: 좌표가 없으면 `Coordinate Data Missing` 상태를 반환한다.
- 완료 조건: 좌표 사용 가능 여부와 이유가 표시된다.
- 관련 데이터: `CoordinateDetectionResult`
- 세부 기준: `14_좌표_탐지_명세.md`

### FR-006. Single Lap Racing Line Viewer

- 설명: 선택한 valid lap의 실제 주행 라인을 Canvas에 표시한다.
- 선행 조건: valid lap 선택, 좌표 데이터 존재.
- 정상 흐름: racing line 전체가 fit-to-view로 표시된다.
- 예외 흐름: 좌표가 없으면 racing line 대신 fallback 메시지를 표시한다.
- 완료 조건: line, hover marker, distance 표시가 동작한다.
- 다양한 track/layout에서도 telemetry 좌표 범위를 자동 계산해 fit-to-view로 표시해야 한다.
- 특정 trackName, SVG preset, hardcoded 좌표 범위에 의존하면 안 된다.
- 관련 화면: Racing Line Viewer
- 관련 데이터: `RacingLineViewData`

### FR-006A. Multi-Track Coordinate Rendering

- 설명: 좌표가 있는 모든 LMU track/layout의 lap을 동일한 viewer 구조로 표시한다.
- 정상 흐름: trackName/layout이 달라도 좌표 min/max와 bounding box로 Canvas fit-to-view를 계산한다.
- 예외 흐름: metadata가 없으면 `Unknown Track`으로 표시하되 좌표가 있으면 viewer는 동작한다.
- 완료 조건: 최소 2개 이상의 서로 다른 track/layout sample에서 racing line이 잘리지 않고 표시된다.

### FR-007. Basic Telemetry Graphs

- 설명: Speed, Brake, Throttle graph를 distance 기준으로 표시한다.
- 정상 흐름: graph와 racing line hover가 동기화된다.
- 완료 조건: hover distance가 Canvas와 graph에 동일하게 표시된다.

### FR-008. Error Handling

- 설명: 손상 파일, 읽기 실패, 누락 channel, invalid lap을 앱 종료 없이 처리한다.
- 정상 흐름: 가능한 데이터는 계속 표시하고 error/warning을 명확히 보여준다.
- 완료 조건: 오류 하나가 전체 앱을 중단시키지 않는다.

### FR-009. Distance Graph Only Fallback

- 설명: 좌표가 없지만 distance와 graph channel이 있으면 graph-only mode를 제공한다.
- 정상 흐름: racing line 대신 fallback message와 가능한 graph를 표시한다.
- 완료 조건: 사용자가 왜 racing line이 없는지 이해할 수 있다.

## 4. 비기능 요구사항

### NFR-001. Performance

- Session list는 3초 이내 표시한다.
- Single lap racing line은 5초 이내 표시한다.
- Hover interaction은 끊김 없이 동작해야 한다.

### NFR-002. Reliability

- 손상된 파일이 있어도 앱이 종료되면 안 된다.
- 좌표 데이터가 없어도 명확한 fallback을 제공해야 한다.

### NFR-003. Usability

- 사용자는 현재 데이터가 실제 XY/GPS 기반인지 즉시 알 수 있어야 한다.
- 그래프보다 racing line이 화면의 중심이어야 한다.

## 5. 상태 정의

- `folder-missing`
- `file-unreadable`
- `session-ready`
- `lap-valid`
- `lap-invalid`
- `coordinates-available`
- `coordinates-missing`
- `racing-line-ready`
- `distance-graph-only`

## 6. 에러/예외 정책

- 폴더 없음: 경로 안내
- 파일 없음: 빈 상태 표시
- 파일 손상: 해당 파일만 error 상태 표시
- 좌표 없음: racing line 대신 fallback 표시
- distance 없음: lap analysis 실패 처리
- invalid lap: 선택 비활성화

## 7. 제외 범위

MVP 제외 범위는 `01_MVP_범위.md`를 따른다.

특히 Best Lap 비교, Ghost, Coach, Heatmap, Focus Zone, AI는 MVP에서 제외한다.

MVP는 Single Lap Viewer지만 Single Track Viewer는 아니다.

## 8. 수락 기준

수락 기준은 `07_수락_테스트.md`를 따른다.
