# 19 DuckDB 조사 결과 샘플

## 1. 조사 범위

조사일: 2026-05-04

사용한 파일 수: 15개

트랙:

- Circuit de Spa-Francorchamps
- Fuji Speedway
- Sebring International Raceway / Sebring School Circuit
- Autodromo Nazionale Monza

세션 타입:

- Race
- Practice

## 2. 공통 구조

조사한 파일들은 모두 다음 구조를 가진다.

| 항목 | 결과 |
| --- | --- |
| table 수 | 101 |
| `metadata` | 존재 |
| `channelsList` | 존재 |
| `eventsList` | 존재 |
| channel table 구조 | 대부분 `value` column만 존재 |
| event table 구조 | 대부분 `ts`, `value` column 존재 |
| channelsList row 수 | 58 |
| eventsList row 수 | 40 |

## 3. Metadata 확인

`metadata` table은 `key`, `value` 구조다.

확인된 주요 key:

- `Version`
- `DriverName`
- `SteamID`
- `RecordingTime`
- `SessionTime`
- `SessionType`
- `TrackName`
- `TrackLayout`
- `WeatherConditions`
- `CarName`
- `CarClass`
- `CarSetup`

## 4. 핵심 채널 확인

다음 채널은 조사한 모든 샘플 파일에서 확인됐다.

| Channel | Frequency | Unit | MVP 사용 |
| --- | ---: | --- | --- |
| `GPS Latitude` | 10Hz | `deg` | 실제 racing line X/Y 후보 |
| `GPS Longitude` | 10Hz | `deg` | 실제 racing line X/Y 후보 |
| `GPS Speed` | 10Hz | `m/s` | 보조 속도 |
| `GPS Time` | 100Hz | `s` | 보조 time 후보 |
| `Lap Dist` | 10Hz | `m` | distance sync 기준 |
| `Total Dist` | 10Hz | `m` | session 누적 거리 |
| `Path Lateral` | 10Hz | `m` | 라인/트랙 위치 보조 후보 |
| `Track Edge` | 10Hz | `m` | track edge 보조 후보 |
| `Ground Speed` | 100Hz | `km/h` | speed graph |
| `Brake Pos` | 50Hz | `%` | brake graph |
| `Throttle Pos` | 50Hz | `%` | throttle graph |
| `Steering Pos` | 100Hz | `%` | steering/future analysis |

## 5. 이벤트 확인

확인된 핵심 event:

- `Lap`
- `Lap Time`
- `Current LapTime`
- `In Pits`
- `Gear`

`Lap`과 `Lap Time`은 `ts`, `value` 구조다.

예시:

```text
Lap:      (30.4175, 0), (191.32, 1), (258.38, 2)
Lap Time: (30.4175, 0.0), (191.32, 74.736), (258.38, 67.054)
```

## 6. 좌표 데이터 확인

조사한 모든 샘플 파일에서 `GPS Latitude`, `GPS Longitude`가 존재했다.

값은 실제 지구 GPS라기보다는 게임/트랙 좌표를 GPS 형식처럼 저장한 값으로 보인다.

그래도 다음 조건을 만족하므로 MVP의 실제 racing line source로 사용할 수 있다.

- 한 랩 동안 값이 연속적으로 변한다.
- track마다 range가 충분하다.
- `Lap Dist`와 같은 10Hz sampling이다.
- 좌표가 없는 fallback만 고려하면 되는 수준이 아니라, 우선 실제 racing line 구현 가능성이 높다.

### 샘플 range

| Track | Lat Delta | Lon Delta | Lap Dist Max |
| --- | ---: | ---: | ---: |
| Spa | 0.018272 | 0.022778 | 6978.53m |
| Fuji | 0.011486 | 0.023237 | 4533.21m |
| Sebring School | 0.005127 ~ 0.005314 | 0.020534 ~ 0.020887 | 약 3080m |
| Monza | 0.019505 ~ 0.019531 | 0.022638 ~ 0.022643 | 약 5778m |

## 7. Lap Distance 확인

`Lap Dist`는 모든 샘플에서 존재했고 unit은 `m`다.

layout별 대략적인 max:

- Spa: 약 6978m
- Fuji: 약 4533m
- Sebring School: 약 3080m
- Monza: 약 5778m

이는 TrackLayout 구분에 매우 중요하다.

예: Sebring은 `TrackName`이 같아도 `TrackLayout = Sebring School Circuit`이고, Lap Dist max도 약 3080m다.

## 8. Lap / Lap Time 주의점

Race 파일은 대부분 `Lap`과 `Lap Time` event 수가 같다.

Practice 파일에서는 수가 다를 수 있다.

예:

- `Autodromo Nazionale Monza_P_2026-04-29T08_35_41Z.duckdb`
  - Lap event: 6
  - Lap Time event: 5

따라서 lap extraction은 다음 규칙이 필요하다.

- `Lap Time <= 0`은 invalid.
- `Lap Time`이 없는 lap은 invalid.
- Practice session에서는 lap number가 0부터 항상 시작하지 않을 수 있다.
- `Lap` event value를 그대로 lapNumber 후보로 사용하되, UI용 순번과 내부 lapId를 분리해야 한다.

## 9. Phase Readiness

| Phase | 상태 | 이유 |
| --- | --- | --- |
| Phase 1 Single Lap Racing Line Viewer | ready | GPS Latitude/Longitude, Lap Dist, Speed/Brake/Throttle이 모든 샘플에서 확인됨 |
| Phase 2 Best Lap Comparison | needs-review | 두 랩 distance alignment는 가능해 보이나 interpolation/valid lap mapping 구현 필요 |
| Phase 3 Ghost Replay | needs-review | distance/time 기반 replay 가능성이 있으나 time mapping 설계 필요 |

## 10. MVP 개발 판단

Phase 1 개발을 시작해도 된다.

단, 첫 개발 범위는 다음으로 제한한다.

- DuckDB read-only reader
- session list
- metadata read
- lap list
- coordinate detection using `GPS Latitude` / `GPS Longitude`
- selected valid lap racing line
- Speed / Brake / Throttle graph
- coordinate missing fallback

아직 구현하지 말 것:

- Best Lap comparison
- Ghost
- Coach
- Delta heatmap
- segment 자동 생성
- AI

## 11. 남은 질문

- `GPS Latitude` / `GPS Longitude`를 화면 좌표로 변환할 때 Y축 반전이 필요한지.
- 좌표 smoothing이 어느 정도 필요한지.
- GPS 좌표와 `Path Lateral`, `Track Edge`를 함께 쓰면 트랙 폭 추정이 가능한지.
- Practice session에서 lap event와 lap time event를 안정적으로 매칭하는 최종 규칙.
