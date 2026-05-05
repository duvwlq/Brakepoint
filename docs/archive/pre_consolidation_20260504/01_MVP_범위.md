# 01 MVP 범위

## 1. MVP 목표

MVP 목표는 다음 하나다.

> LMU telemetry 파일에서 실제 XY/GPS 좌표를 읽어 선택한 단일 랩의 주행 라인을 Canvas에 표시한다.

## 1.1 Single Lap MVP, Multi-Track by Design

MVP는 단일 랩 뷰어지만 단일 트랙 뷰어가 아니다.

좌표 데이터가 있는 모든 LMU track/layout의 lap은 hardcoded track map 없이 표시되어야 한다.

즉, MVP는 Best Lap 비교나 Coach를 하지 않지만 Sebring 같은 특정 트랙 하나에 묶이면 안 된다.

## 2. 포함 범위

### MVP-001. Telemetry Folder 확인

- 기본 LMU telemetry 폴더 확인
- 폴더 존재 여부 표시
- `.duckdb` 파일 개수 표시

### MVP-002. Session List

- `.duckdb` 파일 목록 표시
- `.duckdb.wal` 제외
- 최신순 정렬
- 파일 읽기 실패 상태 표시

### MVP-003. Session Metadata

가능한 경우 다음 metadata를 표시한다.

- TrackName
- TrackLayout
- SessionType
- RecordingTime
- CarName
- CarClass
- DriverName

### MVP-004. Lap List

- Lap / Lap Time event 기반 lap 목록 생성
- valid / invalid 표시
- Best Lap 표시

### MVP-005. Coordinate Detection

- GPS/XY 후보 channel 탐색
- 실제 racing line으로 사용할 수 있는지 판단
- confidence 표시

### MVP-006. Single Lap Racing Line Viewer

- 선택 lap의 실제 XY/GPS racing line 표시
- Canvas fit-to-view
- trackName, trackLayout, 좌표 범위에 의존하지 않는 자동 fit-to-view
- hover marker
- speed / brake / throttle 정보 연결

### MVP-007. Basic Graphs

- Speed graph
- Brake graph
- Throttle graph
- distance 기준 hover sync

### MVP-008. Coordinate Missing Fallback

- 좌표가 없으면 가짜 트랙맵을 만들지 않는다.
- 가능한 graph만 표시한다.
- 사용자가 왜 racing line이 없는지 알 수 있게 한다.

## 3. 제외 범위

MVP 완료 전 구현하지 않는다.

- Best Lap 비교
- Ghost Car
- Coach Insight
- Delta Heatmap
- Segment 자동 생성
- 코너 자동 인식
- 트랙 폭/경계 추정
- SVG 기반 실제 트랙맵
- Focus Zone
- Snapshot 저장
- AI 분석
- F1 25 지원
- 클라우드 업로드

## 4. 완료 기준

- 사용자가 `.duckdb` session 목록을 볼 수 있다.
- 사용자가 valid lap을 선택할 수 있다.
- 좌표 데이터가 있는 lap은 실제 racing line으로 표시된다.
- 서로 다른 LMU track/layout에서도 hardcoded track data 없이 racing line이 표시된다.
- hover 시 line marker와 graph cursor가 같은 distance로 동기화된다.
- 좌표가 없으면 명확한 fallback을 표시한다.
