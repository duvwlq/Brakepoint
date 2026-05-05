from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import duckdb


DEFAULT_LMU_TELEMETRY_FOLDER = (
    r"E:\SteamLibrary\steamapps\common\Le Mans Ultimate\UserData\Telemetry"
)
ENV_LMU_TELEMETRY_PATH = "BRAKEPOINT_LMU_TELEMETRY_PATH"
ENV_LMU_FIXTURE_MODE = "BRAKEPOINT_LMU_FIXTURE_MODE"

CHANNEL_GPS_LAT = "GPS Latitude"
CHANNEL_GPS_LON = "GPS Longitude"
CHANNEL_DISTANCE = "Lap Dist"
CHANNEL_SPEED = "Ground Speed"
CHANNEL_RPM = "Engine RPM"
CHANNEL_BRAKE = "Brake Pos"
CHANNEL_THROTTLE = "Throttle Pos"
CHANNEL_STEERING = "Steering Pos"
CHANNEL_PATH_LATERAL = "Path Lateral"
CHANNEL_TRACK_EDGE = "Track Edge"
EVENT_LAP = "Lap"
EVENT_LAP_TIME = "Lap Time"
EVENT_IN_PITS = "In Pits"
EVENT_GEAR = "Gear"

CORE_CHANNELS = [
    CHANNEL_GPS_LAT,
    CHANNEL_GPS_LON,
    CHANNEL_DISTANCE,
    CHANNEL_SPEED,
    CHANNEL_BRAKE,
    CHANNEL_THROTTLE,
    CHANNEL_STEERING,
]

CORRIDOR_PROBE_CHANNELS = [
    CHANNEL_PATH_LATERAL,
    CHANNEL_TRACK_EDGE,
    CHANNEL_DISTANCE,
    CHANNEL_GPS_LAT,
    CHANNEL_GPS_LON,
]

PRIORITY_TRACK_KEYWORDS = [
    "sebring school",
    "spa",
    "fuji",
    "monza",
    "circuit de la sarthe",
    "bahrain",
    "portim",
]

CORE_EVENTS = [EVENT_LAP, EVENT_LAP_TIME, EVENT_IN_PITS]


class LmuDuckDbError(RuntimeError):
    def __init__(self, code: str, message: str, detail: str | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.detail = detail

    def to_api_error(self) -> dict[str, Any]:
        error = {"code": self.code, "message": self.message}
        if self.detail:
            error["detail"] = self.detail
        return error


@dataclass(frozen=True)
class LmuSource:
    source_id: str
    path: Path


@dataclass(frozen=True)
class LmuFixtureOptions:
    mode: str | None = None

    @property
    def force_no_coordinates(self) -> bool:
        return self.mode == "no-coordinates"


def ok(data: Any) -> dict[str, Any]:
    return {"ok": True, "data": data}


def err(code: str, message: str, detail: str | None = None) -> dict[str, Any]:
    error = {"code": code, "message": message}
    if detail:
        error["detail"] = detail
    return {"ok": False, "error": error}


def stable_id(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]


def normalize_session_type(value: str | None) -> str:
    if not value:
        return "unknown"
    normalized = value.strip().lower()
    if normalized in {"p", "practice"}:
        return "practice"
    if normalized in {"q", "qualifying", "qualification"}:
        return "qualifying"
    if normalized in {"r", "race"}:
        return "race"
    if "practice" in normalized:
        return "practice"
    if "qual" in normalized:
        return "qualifying"
    if "race" in normalized:
        return "race"
    return "unknown"


def safe_float(value: Any) -> float | None:
    try:
        if value is None:
            return None
        number = float(value)
        if math.isnan(number) or math.isinf(number):
            return None
        return number
    except (TypeError, ValueError):
        return None


def normalize_percent(value: Any) -> float | None:
    number = safe_float(value)
    if number is None:
        return None
    if number > 1.0:
        number = number / 100.0
    return max(0.0, min(1.0, number))


def as_list(rows: Iterable[tuple[Any, ...]]) -> list[Any]:
    return [row[0] for row in rows]


def quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def resolve_lmu_telemetry_folder(
    telemetry_folder: str | os.PathLike[str] | None,
) -> Path:
    if telemetry_folder:
        return Path(telemetry_folder)
    env_override = os.environ.get(ENV_LMU_TELEMETRY_PATH)
    if env_override:
        return Path(env_override)
    return Path(DEFAULT_LMU_TELEMETRY_FOLDER)


def fixture_options_from_env() -> LmuFixtureOptions:
    raw_mode = os.environ.get(ENV_LMU_FIXTURE_MODE)
    mode = raw_mode.strip() if raw_mode else None
    return LmuFixtureOptions(mode=mode or None)


class LmuDuckDbAdapter:
    game_id = "lmu"
    display_name = "Le Mans Ultimate"

    def __init__(self, telemetry_folder: str | os.PathLike[str] | None = None) -> None:
        self.telemetry_folder = resolve_lmu_telemetry_folder(telemetry_folder)
        self.fixture_options = fixture_options_from_env()
        self._sessions_by_id: dict[str, Path] = {}

    def get_capabilities(self) -> dict[str, Any]:
        return {
            "sourceKind": ["duckdb-file"],
            "supportsPostSessionImport": True,
            "supportsLiveCapture": False,
            "telemetry": {
                "speed": "supported",
                "brake": "supported",
                "throttle": "supported",
                "steering": "supported",
                "rpm": "supported",
                "gear": "partial",
                "coordinates": "supported",
                "distance": "supported",
                "lapTimes": "supported",
                "sectorTimes": "unknown",
            },
            "context": {
                "track": "supported",
                "layout": "supported",
                "car": "supported",
                "carClass": "supported",
                "sessionType": "supported",
                "raceResult": "unknown",
                "participants": "unknown",
                "weather": "supported",
                "tyre": "unknown",
                "fuel": "unknown",
            },
        }

    def track_corridor_probe(
        self,
        limit: int | None = None,
        session_id: str | None = None,
        file_path: str | None = None,
    ) -> dict[str, Any]:
        from datetime import datetime, timezone

        sessions = self.list_sessions()
        if file_path:
            target_path = Path(file_path)
            target_id = self.session_id_for_path(target_path)
            self._sessions_by_id[target_id] = target_path
            sessions = [self.build_session_for_validation(target_path, target_id)]
        elif session_id:
            sessions = [session for session in sessions if session["sessionId"] == session_id]
        else:
            sessions = self.select_corridor_probe_sessions(sessions, limit)

        if limit is not None and (session_id or file_path):
            sessions = sessions[:limit]

        session_reports: list[dict[str, Any]] = []
        blockers: list[str] = []
        next_questions: list[str] = [
            "Does Track Edge represent one edge distance, total width, or another normalized offset?",
            "Is Path Lateral sign direction stable across cars and tracks?",
            "Can left/right edge inference be validated against visual replay or known circuit geometry?",
        ]
        verdicts: list[str] = []
        laps_scanned = 0

        for session in sessions:
            if session.get("status") == "error":
                blockers.append(
                    f"{session.get('fileName')}: session could not be read for corridor probe."
                )
                session_reports.append(
                    {
                        "sessionId": session.get("sessionId"),
                        "fileName": session.get("fileName"),
                        "trackName": session.get("track", {}).get("displayName"),
                        "trackLayout": session.get("track", {}).get("layoutName"),
                        "carName": session.get("car", {}).get("displayName"),
                        "sessionType": session.get("sessionType"),
                        "laps": [],
                    }
                )
                continue

            try:
                report = self.probe_corridor_session(session)
                session_reports.append(report)
                laps_scanned += len(report["laps"])
                verdicts.extend(
                    lap["corridorFeasibility"]["verdict"]
                    for lap in report["laps"]
                    if lap.get("isValid")
                )
            except Exception as exc:
                blockers.append(f"{session.get('fileName')}: {exc}")

        global_verdict = self.global_corridor_verdict(verdicts, blockers, session_reports)
        return {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "sessionsScanned": len(session_reports),
            "lapsScanned": laps_scanned,
            "sessions": session_reports,
            "globalVerdict": global_verdict,
            "blockers": blockers,
            "nextQuestions": next_questions,
        }

    def track_edge_semantics_probe(
        self,
        limit: int | None = None,
        session_id: str | None = None,
        file_path: str | None = None,
    ) -> dict[str, Any]:
        from datetime import datetime, timezone

        self.verify_projected_meter_reports()
        sessions = self.list_sessions()
        if file_path:
            target_path = Path(file_path)
            target_id = self.session_id_for_path(target_path)
            self._sessions_by_id[target_id] = target_path
            sessions = [self.build_session_for_validation(target_path, target_id)]
        elif session_id:
            sessions = [session for session in sessions if session["sessionId"] == session_id]
        else:
            sessions = self.select_corridor_probe_sessions(sessions, limit)

        if limit is not None and (session_id or file_path):
            sessions = sessions[:limit]

        session_reports: list[dict[str, Any]] = []
        blockers: list[str] = []
        next_questions = [
            "Does Track Edge encode one-sided distance, signed side preference, or another LMU-specific path-relative signal?",
            "Is Path Lateral zero tied to track center, reference path, or ideal path?",
            "Do car/class combinations change Track Edge semantics or only scale?",
        ]
        laps_scanned = 0
        global_path_values: list[float] = []
        global_edge_values: list[float] = []
        lap_verdicts: list[str] = []

        for session in sessions:
            if session.get("status") == "error":
                blockers.append(
                    f"{session.get('fileName')}: session could not be read for semantics probe."
                )
                session_reports.append(
                    {
                        "sessionId": session.get("sessionId"),
                        "fileName": session.get("fileName"),
                        "trackName": session.get("track", {}).get("displayName"),
                        "trackLayout": session.get("track", {}).get("layoutName"),
                        "carName": session.get("car", {}).get("displayName"),
                        "carClass": session.get("car", {}).get("carClass"),
                        "sessionType": session.get("sessionType"),
                        "laps": [],
                    }
                )
                continue

            try:
                report = self.probe_track_edge_semantics_session(session)
                session_reports.append(report)
                laps_scanned += len(report["laps"])
                for lap_report in report["laps"]:
                    lap_verdicts.append(lap_report["semanticsVerdict"]["verdict"])
                    pairs = lap_report.get("_pairedSamples", [])
                    global_path_values.extend(pair[0] for pair in pairs)
                    global_edge_values.extend(pair[1] for pair in pairs)
            except Exception as exc:
                blockers.append(f"{session.get('fileName')}: {exc}")

        for session in session_reports:
            for lap in session.get("laps", []):
                lap.pop("_pairedSamples", None)

        global_stats = self.global_semantics_stats(global_path_values, global_edge_values)
        global_verdict = self.global_track_edge_semantics_verdict(
            lap_verdicts,
            blockers,
            session_reports,
            global_stats,
        )
        return {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "sessionsScanned": len(session_reports),
            "lapsScanned": laps_scanned,
            "globalVerdict": global_verdict,
            "globalStats": global_stats,
            "sessions": session_reports,
            "blockers": blockers,
            "nextQuestions": next_questions,
        }

    def validate(
        self,
        limit: int | None = None,
        session_id: str | None = None,
        file_path: str | None = None,
    ) -> dict[str, Any]:
        from datetime import datetime, timezone

        self.list_sessions()
        sessions = self.list_sessions()
        if file_path:
            target_path = Path(file_path)
            target_id = self.session_id_for_path(target_path)
            self._sessions_by_id[target_id] = target_path
            sessions = [self.build_session_for_validation(target_path, target_id)]
        elif session_id:
            sessions = [session for session in sessions if session["sessionId"] == session_id]
        if limit is not None:
            sessions = sessions[:limit]

        report_sessions: list[dict[str, Any]] = []
        blockers: list[str] = []
        warnings: list[str] = []
        summary = {
            "filesScanned": 0,
            "sessionsReady": 0,
            "sessionsError": 0,
            "totalLaps": 0,
            "validLaps": 0,
            "invalidLaps": 0,
            "realRacingLineLaps": 0,
            "distanceGraphOnlyLaps": 0,
            "missingDistanceLaps": 0,
            "partialChannelLaps": 0,
        }

        for session in sessions:
            summary["filesScanned"] += 1
            if session.get("status") == "error":
                summary["sessionsError"] += 1
                report_sessions.append(self.error_validation_session(session))
                continue

            try:
                session_report = self.validate_session(session)
                report_sessions.append(session_report)
                summary["sessionsReady"] += 1
                summary["totalLaps"] += session_report["lapCount"]
                summary["validLaps"] += session_report["validLapCount"]
                summary["invalidLaps"] += session_report["invalidLapCount"]
                for lap_report in session_report["laps"]:
                    if lap_report.get("mode") == "real-racing-line":
                        summary["realRacingLineLaps"] += 1
                    if lap_report.get("mode") == "distance-graph-only":
                        summary["distanceGraphOnlyLaps"] += 1
                    if lap_report.get("errorCode") == "MISSING_DISTANCE":
                        summary["missingDistanceLaps"] += 1
                    if any(w.get("code") == "PARTIAL_CHANNELS" for w in lap_report.get("warnings", [])):
                        summary["partialChannelLaps"] += 1
            except Exception as exc:
                summary["sessionsError"] += 1
                blockers.append(f"{session.get('fileName')}: {exc}")
                report_sessions.append(
                    {
                        "sessionId": session.get("sessionId"),
                        "fileName": session.get("fileName"),
                        "status": "error",
                        "warnings": [],
                        "errors": [str(exc)],
                    }
                )

        return {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "sourcePath": str(self.telemetry_folder),
            "summary": summary,
            "sessions": report_sessions,
            "blockers": blockers,
            "warnings": warnings,
        }

    def select_corridor_probe_sessions(
        self,
        sessions: list[dict[str, Any]],
        limit: int | None,
    ) -> list[dict[str, Any]]:
        ready_sessions = [session for session in sessions if session.get("status") == "ready"]
        if limit is None:
            return ready_sessions

        scored: list[tuple[tuple[int, int, int], tuple[str, str], dict[str, Any]]] = []
        for index, session in enumerate(ready_sessions):
            track_bits = " ".join(
                [
                    str(session.get("track", {}).get("displayName") or "").lower(),
                    str(session.get("track", {}).get("layoutName") or "").lower(),
                    str(session.get("fileName") or "").lower(),
                ]
            )
            priority = next(
                (rank for rank, keyword in enumerate(PRIORITY_TRACK_KEYWORDS) if keyword in track_bits),
                len(PRIORITY_TRACK_KEYWORDS),
            )
            layout_key = (
                str(session.get("track", {}).get("displayName") or ""),
                str(session.get("track", {}).get("layoutName") or ""),
            )
            scored.append(((priority, 0, index), layout_key, session))

        scored.sort(key=lambda item: item[0])
        selected: list[dict[str, Any]] = []
        seen_layouts: set[tuple[str, str]] = set()
        for _, layout_key, session in scored:
            if layout_key in seen_layouts and len(selected) < limit and len(seen_layouts) < limit:
                continue
            selected.append(session)
            seen_layouts.add(layout_key)
            if len(selected) >= limit:
                return selected
        for _, _, session in scored:
            if session not in selected:
                selected.append(session)
            if len(selected) >= limit:
                break
        return selected[:limit]

    def build_session_for_validation(self, file_path: Path, session_id: str) -> dict[str, Any]:
        try:
            metadata = self.read_metadata(file_path)
            return self.build_session_summary(file_path, session_id, metadata)
        except Exception as exc:
            return self.build_error_session_summary(file_path, session_id, str(exc))

    def error_validation_session(self, session: dict[str, Any]) -> dict[str, Any]:
        return {
            "sessionId": session.get("sessionId"),
            "fileName": session.get("fileName"),
            "status": "error",
            "trackName": session.get("track", {}).get("displayName"),
            "trackLayout": session.get("track", {}).get("layoutName"),
            "carName": session.get("car", {}).get("displayName"),
            "carClass": session.get("car", {}).get("carClass"),
            "sessionType": session.get("sessionType"),
            "lapCount": 0,
            "validLapCount": 0,
            "invalidLapCount": 0,
            "channels": self.empty_channel_report(),
            "laps": [],
            "warnings": session.get("warnings", []),
            "errors": [w.get("detail") or w.get("message") for w in session.get("warnings", [])],
        }

    def validate_session(self, session: dict[str, Any]) -> dict[str, Any]:
        detail = self.load_session(session["sessionId"])
        file_path = self.resolve_session_id(session["sessionId"])
        channels = self.channel_availability(file_path)
        laps = detail["laps"]
        best_lap = next((lap for lap in laps if lap.get("isBest")), None)
        lap_reports = [self.validate_lap(session["sessionId"], lap) for lap in laps]
        return {
            "sessionId": session["sessionId"],
            "fileName": session.get("fileName"),
            "status": session.get("status"),
            "trackName": session.get("track", {}).get("displayName"),
            "trackLayout": session.get("track", {}).get("layoutName"),
            "carName": session.get("car", {}).get("displayName"),
            "carClass": session.get("car", {}).get("carClass"),
            "sessionType": session.get("sessionType"),
            "lapCount": len(laps),
            "validLapCount": sum(1 for lap in laps if lap["isValid"]),
            "invalidLapCount": sum(1 for lap in laps if not lap["isValid"]),
            "bestLapId": best_lap.get("lapId") if best_lap else None,
            "bestLapTimeMs": best_lap.get("lapTimeMs") if best_lap else None,
            "channels": channels,
            "laps": lap_reports,
            "warnings": session.get("warnings", []),
            "errors": [],
        }

    def validate_lap(self, session_id: str, lap: dict[str, Any]) -> dict[str, Any]:
        base: dict[str, Any] = {
            "lapId": lap["lapId"],
            "lapNumber": lap["lapNumber"],
            "lapTimeMs": lap["lapTimeMs"],
            "isValid": lap["isValid"],
            "isBest": lap["isBest"],
            "warnings": list(lap.get("warnings", [])),
        }
        if not lap["isValid"]:
            base.update(
                {
                    "distance": {
                        "minM": None,
                        "maxM": lap.get("distanceM"),
                        "isMonotonic": False,
                        "rawDistanceBacksteps": 0,
                        "repairedDistanceBacksteps": 0,
                        "remainingBacksteps": 0,
                        "distanceRepairStrategy": "none",
                    },
                    "channels": {},
                    "errorCode": "LAP_INVALID",
                }
            )
            return base

        try:
            view = self.load_lap_telemetry(session_id, lap["lapId"])
            graph_points = view.get("graphPoints", [])
            racing_line = view.get("racingLine", [])
            distances = [p.get("distanceM") for p in graph_points if p.get("distanceM") is not None]
            raw_backsteps = self.raw_distance_backsteps(session_id, lap["lapNumber"])
            remaining_backsteps = self.count_backsteps(distances)
            bbox = self.coordinate_bbox(racing_line)
            base.update(
                {
                    "mode": view.get("mode"),
                    "pointCount": len(racing_line),
                    "graphPointCount": len(graph_points),
                    "distance": {
                        "minM": min(distances) if distances else None,
                        "maxM": max(distances) if distances else None,
                        "isMonotonic": self.is_monotonic(distances),
                        "rawDistanceBacksteps": raw_backsteps,
                        "repairedDistanceBacksteps": max(0, raw_backsteps - remaining_backsteps),
                        "remainingBacksteps": remaining_backsteps,
                        "distanceRepairStrategy": "cumulative-max"
                        if raw_backsteps
                        else "none",
                    },
                    "coordinates": {
                        "source": view.get("coordinateStatus", {}).get("source"),
                        "confidence": view.get("coordinateStatus", {}).get("confidence"),
                        **bbox,
                    },
                    "channels": {
                        "speedCoverage": self.coverage(graph_points, "speedKph"),
                        "brakeCoverage": self.coverage(graph_points, "brake01"),
                        "throttleCoverage": self.coverage(graph_points, "throttle01"),
                        "steeringCoverage": self.coverage(graph_points, "steering01"),
                    },
                    "warnings": base["warnings"] + view.get("warnings", []),
                }
            )
        except LmuDuckDbError as exc:
            base.update(
                {
                    "distance": {
                        "minM": None,
                        "maxM": lap.get("distanceM"),
                        "isMonotonic": False,
                        "rawDistanceBacksteps": 0,
                        "repairedDistanceBacksteps": 0,
                        "remainingBacksteps": 0,
                        "distanceRepairStrategy": "none",
                    },
                    "channels": {},
                    "errorCode": exc.code,
                    "warnings": base["warnings"],
                }
            )
        return base

    def probe_corridor_session(self, session: dict[str, Any]) -> dict[str, Any]:
        detail = self.load_session(session["sessionId"])
        laps = [lap for lap in detail["laps"] if lap.get("isValid")]
        lap_reports = [self.probe_corridor_lap(session, lap) for lap in laps]
        return {
            "sessionId": session["sessionId"],
            "fileName": session.get("fileName"),
            "trackName": session.get("track", {}).get("displayName"),
            "trackLayout": session.get("track", {}).get("layoutName"),
            "carName": session.get("car", {}).get("displayName"),
            "sessionType": session.get("sessionType"),
            "laps": lap_reports,
        }

    def probe_track_edge_semantics_session(self, session: dict[str, Any]) -> dict[str, Any]:
        detail = self.load_session(session["sessionId"])
        laps = [lap for lap in detail["laps"] if lap.get("isValid")]
        lap_reports = [self.probe_track_edge_semantics_lap(session, lap) for lap in laps]
        return {
            "sessionId": session["sessionId"],
            "fileName": session.get("fileName"),
            "trackName": session.get("track", {}).get("displayName"),
            "trackLayout": session.get("track", {}).get("layoutName"),
            "carName": session.get("car", {}).get("displayName"),
            "carClass": session.get("car", {}).get("carClass"),
            "sessionType": session.get("sessionType"),
            "laps": lap_reports,
        }

    def probe_corridor_lap(
        self,
        session: dict[str, Any],
        lap: dict[str, Any],
    ) -> dict[str, Any]:
        session_id = session["sessionId"]
        file_path = self.resolve_session_id(session_id)
        telemetry = self.load_lap_telemetry(session_id, lap["lapId"])
        racing_line = telemetry.get("racingLine", [])
        bbox = self.coordinate_bbox(racing_line)
        channel_samples = self.load_corridor_probe_samples(file_path, lap["lapNumber"])
        path_report = self.channel_probe_report(
            channel_samples.get("pathLateral", []),
            channel_samples.get("distance", []),
            "Path Lateral",
        )
        edge_report = self.channel_probe_report(
            channel_samples.get("trackEdge", []),
            channel_samples.get("distance", []),
            "Track Edge",
        )
        corridor = self.corridor_feasibility_report(path_report, edge_report)
        return {
            "lapId": lap["lapId"],
            "lapNumber": lap["lapNumber"],
            "lapTimeMs": lap["lapTimeMs"],
            "isValid": lap["isValid"],
            "racingLine": {
                "pointCount": len(racing_line),
                "maxDistanceM": max((p.get("distanceM") for p in racing_line if p.get("distanceM") is not None), default=None),
                "bboxWidth": bbox.get("bboxWidth"),
                "bboxHeight": bbox.get("bboxHeight"),
                "coordinateSource": telemetry.get("coordinateStatus", {}).get("source"),
                "coordinateUnit": telemetry.get("coordinateStatus", {}).get("coordinateUnit"),
            },
            "pathLateral": path_report,
            "trackEdge": edge_report,
            "corridorFeasibility": corridor,
        }

    def probe_track_edge_semantics_lap(
        self,
        session: dict[str, Any],
        lap: dict[str, Any],
    ) -> dict[str, Any]:
        session_id = session["sessionId"]
        file_path = self.resolve_session_id(session_id)
        channel_samples = self.load_corridor_probe_samples(file_path, lap["lapNumber"])
        path_stats = self.extended_sample_stats(channel_samples.get("pathLateral", []))
        edge_stats = self.extended_sample_stats(channel_samples.get("trackEdge", []))
        distance_aligned = self.distance_alignment_feasible(
            channel_samples.get("distance", []),
            channel_samples.get("trackEdge", []),
        ) and self.distance_alignment_feasible(
            channel_samples.get("distance", []),
            channel_samples.get("pathLateral", []),
        )
        paired_samples = self.paired_channel_samples(
            channel_samples.get("pathLateral", []),
            channel_samples.get("trackEdge", []),
        )
        correlation = self.correlation_report(paired_samples, distance_aligned)
        bucket_analysis = self.path_lateral_bucket_analysis(paired_samples)
        verdict = self.track_edge_semantics_verdict(
            path_stats,
            edge_stats,
            correlation,
            distance_aligned,
            paired_samples,
        )
        return {
            "lapId": lap["lapId"],
            "lapNumber": lap["lapNumber"],
            "maxDistanceM": lap.get("distanceM"),
            "pathLateral": self.sample_report(path_stats),
            "trackEdge": self.sample_report(edge_stats),
            "correlation": correlation,
            "bucketAnalysis": bucket_analysis,
            "semanticsVerdict": verdict,
            "_pairedSamples": paired_samples,
        }

    def load_corridor_probe_samples(
        self,
        file_path: Path,
        lap_number: int,
    ) -> dict[str, list[float | None]]:
        with self.connect(file_path) as con:
            distance = [safe_float(v) for v in self.read_table_values(con, CHANNEL_DISTANCE)]
            lat = [safe_float(v) for v in self.read_table_values(con, CHANNEL_GPS_LAT)]
            lon = [safe_float(v) for v in self.read_table_values(con, CHANNEL_GPS_LON)]
            path_lateral = [safe_float(v) for v in self.read_table_values(con, CHANNEL_PATH_LATERAL)]
            track_edge = [safe_float(v) for v in self.read_table_values(con, CHANNEL_TRACK_EDGE)]

        segment = self.segment_for_lap(distance, lap_number)
        original_distance_len = len(distance)
        if segment is not None:
            distance = self.slice_by_base_segment(distance, segment, len(distance))
            lat = self.slice_by_base_segment(lat, segment, original_distance_len)
            lon = self.slice_by_base_segment(lon, segment, original_distance_len)
            path_lateral = self.slice_by_base_segment(path_lateral, segment, original_distance_len)
            track_edge = self.slice_by_base_segment(track_edge, segment, original_distance_len)
        distance = self.clean_lap_distance(distance)
        return {
            "distance": distance,
            "lat": lat,
            "lon": lon,
            "pathLateral": path_lateral,
            "trackEdge": track_edge,
        }

    def channel_probe_report(
        self,
        samples: list[float | None],
        distance: list[float | None],
        label: str,
    ) -> dict[str, Any]:
        stats = self.sample_stats(samples)
        if stats["sampleCount"] == 0:
            return {
                "exists": False,
                "confidence": "none",
                "reason": f"{label} channel is missing or empty.",
            }

        distance_aligned = self.distance_alignment_feasible(distance, samples)
        confidence, reason = self.channel_probe_confidence(label, stats, distance_aligned)
        return {
            "exists": True,
            "sampleCount": stats["sampleCount"],
            "min": stats["min"],
            "max": stats["max"],
            "mean": stats["mean"],
            "variance": stats["variance"],
            "distanceAligned": distance_aligned,
            "confidence": confidence,
            "reason": reason,
        }

    def sample_stats(self, samples: list[float | None]) -> dict[str, Any]:
        values = [value for value in samples if value is not None]
        if not values:
            return {
                "sampleCount": 0,
                "min": None,
                "max": None,
                "mean": None,
                "variance": None,
                "range": None,
                "hasNegative": False,
                "hasPositive": False,
            }
        mean = sum(values) / len(values)
        variance = sum((value - mean) ** 2 for value in values) / len(values)
        minimum = min(values)
        maximum = max(values)
        return {
            "sampleCount": len(values),
            "min": minimum,
            "max": maximum,
            "mean": mean,
            "variance": variance,
            "range": maximum - minimum,
            "hasNegative": minimum < 0,
            "hasPositive": maximum > 0,
        }

    def extended_sample_stats(self, samples: list[float | None]) -> dict[str, Any]:
        stats = self.sample_stats(samples)
        values = [value for value in samples if value is not None]
        if not values:
            stats.update(
                {
                    "positiveRatio": None,
                    "negativeRatio": None,
                    "nearZeroRatio": None,
                }
            )
            return stats
        near_zero_threshold = self.near_zero_threshold(values)
        stats.update(
            {
                "positiveRatio": sum(1 for value in values if value > 0) / len(values),
                "negativeRatio": sum(1 for value in values if value < 0) / len(values),
                "nearZeroRatio": sum(1 for value in values if abs(value) <= near_zero_threshold)
                / len(values),
            }
        )
        return stats

    def sample_report(self, stats: dict[str, Any]) -> dict[str, Any]:
        if stats.get("sampleCount", 0) == 0:
            return {"exists": False}
        return {
            "exists": True,
            "sampleCount": stats.get("sampleCount"),
            "min": stats.get("min"),
            "max": stats.get("max"),
            "mean": stats.get("mean"),
            "variance": stats.get("variance"),
            "positiveRatio": stats.get("positiveRatio"),
            "negativeRatio": stats.get("negativeRatio"),
            "nearZeroRatio": stats.get("nearZeroRatio"),
        }

    def near_zero_threshold(self, values: list[float]) -> float:
        if not values:
            return 0.5
        minimum = min(values)
        maximum = max(values)
        return max(0.5, (maximum - minimum) * 0.08)

    def paired_channel_samples(
        self,
        first: list[float | None],
        second: list[float | None],
    ) -> list[tuple[float, float]]:
        count = min(len(first), len(second))
        pairs: list[tuple[float, float]] = []
        for index in range(count):
            left = first[index]
            right = second[index]
            if left is None or right is None:
                continue
            pairs.append((left, right))
        return pairs

    def pearson_correlation(self, xs: list[float], ys: list[float]) -> float | None:
        if len(xs) != len(ys) or len(xs) < 3:
            return None
        mean_x = sum(xs) / len(xs)
        mean_y = sum(ys) / len(ys)
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
        denom_x = sum((x - mean_x) ** 2 for x in xs)
        denom_y = sum((y - mean_y) ** 2 for y in ys)
        denominator = math.sqrt(denom_x * denom_y)
        if denominator <= 0:
            return None
        return numerator / denominator

    def correlation_report(
        self,
        pairs: list[tuple[float, float]],
        distance_aligned: bool,
    ) -> dict[str, Any]:
        if not distance_aligned:
            return {
                "confidence": "none",
                "reason": "Path Lateral / Track Edge alignment to lap distance was not stable enough for semantics analysis.",
            }
        if len(pairs) < 20:
            return {
                "confidence": "none",
                "reason": "Too few paired Path Lateral / Track Edge samples were available.",
            }
        xs = [pair[0] for pair in pairs]
        ys = [pair[1] for pair in pairs]
        pearson = self.pearson_correlation(xs, ys)
        abs_pairs = [(abs(x), abs(y)) for x, y in pairs]
        abs_pearson = self.pearson_correlation(
            [pair[0] for pair in abs_pairs],
            [pair[1] for pair in abs_pairs],
        )
        strength = abs(pearson) if pearson is not None else 0.0
        if strength >= 0.7:
            confidence = "high"
        elif strength >= 0.4:
            confidence = "medium"
        elif strength > 0:
            confidence = "low"
        else:
            confidence = "none"
        return {
            "pearson": pearson,
            "absPearson": abs_pearson,
            "confidence": confidence,
            "reason": self.correlation_reason(pearson, abs_pearson, confidence),
        }

    def correlation_reason(
        self,
        pearson: float | None,
        abs_pearson: float | None,
        confidence: str,
    ) -> str:
        if pearson is None:
            return "Correlation could not be computed from the available paired samples."
        if confidence == "high":
            return "Path Lateral and Track Edge show a strong paired relationship, but this still does not prove actual boundary semantics."
        if confidence == "medium":
            return "Path Lateral and Track Edge show a moderate paired relationship, which supports more research but not boundary claims."
        if confidence == "low":
            return "Path Lateral and Track Edge show only a weak paired relationship."
        if abs_pearson is not None and abs_pearson >= 0.4:
            return "Absolute magnitudes show some relationship, but signed semantics remain unclear."
        return "No meaningful Path Lateral / Track Edge correlation was observed."

    def bucket_summary(self, pairs: list[tuple[float, float]]) -> dict[str, Any]:
        track_edge_values = [pair[1] for pair in pairs]
        path_values = [pair[0] for pair in pairs]
        return {
            "sampleCount": len(pairs),
            "pathLateralMin": min(path_values) if path_values else None,
            "pathLateralMax": max(path_values) if path_values else None,
            "trackEdgeMin": min(track_edge_values) if track_edge_values else None,
            "trackEdgeMax": max(track_edge_values) if track_edge_values else None,
            "trackEdgeMean": sum(track_edge_values) / len(track_edge_values)
            if track_edge_values
            else None,
        }

    def path_lateral_bucket_analysis(
        self,
        pairs: list[tuple[float, float]],
    ) -> dict[str, Any]:
        if not pairs:
            return {}
        path_values = [pair[0] for pair in pairs]
        threshold = self.near_zero_threshold(path_values)
        near_zero = [pair for pair in pairs if abs(pair[0]) <= threshold]
        negative_cut = min(path_values) + (max(path_values) - min(path_values)) * 0.15
        positive_cut = max(path_values) - (max(path_values) - min(path_values)) * 0.15
        extreme_negative = [pair for pair in pairs if pair[0] <= negative_cut]
        extreme_positive = [pair for pair in pairs if pair[0] >= positive_cut]
        return {
            "nearZeroPathLateral": self.bucket_summary(near_zero) if near_zero else {"sampleCount": 0},
            "extremeNegativePathLateral": self.bucket_summary(extreme_negative)
            if extreme_negative
            else {"sampleCount": 0},
            "extremePositivePathLateral": self.bucket_summary(extreme_positive)
            if extreme_positive
            else {"sampleCount": 0},
        }

    def track_edge_semantics_verdict(
        self,
        path_stats: dict[str, Any],
        edge_stats: dict[str, Any],
        correlation: dict[str, Any],
        distance_aligned: bool,
        pairs: list[tuple[float, float]],
    ) -> dict[str, str]:
        if path_stats.get("sampleCount", 0) < 20 or edge_stats.get("sampleCount", 0) < 20:
            return {
                "verdict": "not-supported",
                "reason": "Track Edge or Path Lateral samples were too sparse for semantics analysis.",
            }
        if not distance_aligned:
            return {
                "verdict": "not-supported",
                "reason": "Track Edge / Path Lateral could not be aligned reliably to lap distance.",
            }
        path_crosses = bool(path_stats.get("hasNegative") and path_stats.get("hasPositive"))
        edge_positive_only = (
            edge_stats.get("negativeRatio") is not None and edge_stats.get("negativeRatio") < 0.01
        )
        corr_value = correlation.get("pearson")
        abs_corr = correlation.get("absPearson")
        if (
            path_crosses
            and edge_positive_only
            and correlation.get("confidence") == "high"
            and abs_corr is not None
            and abs_corr >= 0.75
            and len(pairs) >= 100
        ):
            return {
                "verdict": "actual-boundary-supported",
                "reason": "Track Edge stays physically positive and shows a strong stable relationship to Path Lateral across enough paired samples.",
            }
        if path_crosses and edge_stats.get("sampleCount", 0) >= 20:
            return {
                "verdict": "estimated-corridor-only",
                "reason": "Path Lateral supports estimated placement, but Track Edge still has unresolved signed semantics and cannot justify actual boundary claims.",
            }
        if corr_value is not None or abs_corr is not None:
            return {
                "verdict": "needs-more-research",
                "reason": "Some Track Edge relationships are measurable, but not enough to interpret the signal as actual boundary geometry.",
            }
        return {
            "verdict": "not-supported",
            "reason": "No reliable Track Edge semantics could be established from the current lap sample.",
        }

    def global_semantics_stats(
        self,
        path_values: list[float],
        edge_values: list[float],
    ) -> dict[str, Any]:
        path_stats = self.extended_sample_stats(path_values)
        edge_stats = self.extended_sample_stats(edge_values)
        correlation = self.pearson_correlation(path_values, edge_values)
        abs_correlation = self.pearson_correlation(
            [abs(value) for value in path_values],
            [abs(value) for value in edge_values],
        )
        return {
            "pathLateralMin": path_stats.get("min"),
            "pathLateralMax": path_stats.get("max"),
            "pathLateralMean": path_stats.get("mean"),
            "pathLateralVariance": path_stats.get("variance"),
            "trackEdgeMin": edge_stats.get("min"),
            "trackEdgeMax": edge_stats.get("max"),
            "trackEdgeMean": edge_stats.get("mean"),
            "trackEdgeVariance": edge_stats.get("variance"),
            "correlation": correlation,
            "absCorrelation": abs_correlation,
            "trackEdgePositiveRatio": edge_stats.get("positiveRatio"),
            "trackEdgeNegativeRatio": edge_stats.get("negativeRatio"),
            "trackEdgeNearZeroRatio": edge_stats.get("nearZeroRatio"),
            "pathLateralPositiveRatio": path_stats.get("positiveRatio"),
            "pathLateralNegativeRatio": path_stats.get("negativeRatio"),
            "pathLateralNearZeroRatio": path_stats.get("nearZeroRatio"),
        }

    def global_track_edge_semantics_verdict(
        self,
        lap_verdicts: list[str],
        blockers: list[str],
        session_reports: list[dict[str, Any]],
        global_stats: dict[str, Any],
    ) -> dict[str, str]:
        if not lap_verdicts:
            return {
                "verdict": "not-supported",
                "reason": "No valid laps produced semantics probe results.",
            }
        unique_tracks = {
            (session.get("trackName"), session.get("trackLayout"))
            for session in session_reports
            if session.get("laps")
        }
        if (
            "actual-boundary-supported" in lap_verdicts
            and len(unique_tracks) >= 3
            and (global_stats.get("trackEdgeNegativeRatio") or 0) < 0.01
        ):
            return {
                "verdict": "actual-boundary-supported",
                "reason": "Track Edge remained physically positive with stable multi-track behavior in the current sample.",
            }
        if "estimated-corridor-only" in lap_verdicts and len(unique_tracks) >= 2:
            return {
                "verdict": "estimated-corridor-only",
                "reason": "Path Lateral remains useful for estimated placement, but Track Edge semantics are still not strong enough for actual boundary claims.",
            }
        if "needs-more-research" in lap_verdicts or blockers:
            return {
                "verdict": "needs-more-research",
                "reason": "Some relationships are measurable, but semantics remain inconsistent or under-sampled.",
            }
        return {
            "verdict": "not-supported",
            "reason": "The current sample does not support Track Edge semantics beyond unresolved telemetry behavior.",
        }

    def verify_projected_meter_reports(self) -> None:
        reports_dir = Path("reports")
        if not reports_dir.exists():
            return
        for report_path in reports_dir.glob("track_corridor_probe*.json"):
            text = report_path.read_text(encoding="utf-8")
            if '"coordinateUnit": "gps-degree"' in text:
                raise LmuDuckDbError(
                    "UNKNOWN_ERROR",
                    "Corridor report metadata is stale.",
                    f"{report_path} still contains coordinateUnit gps-degree.",
                )

    def distance_alignment_feasible(
        self,
        distance: list[float | None],
        channel: list[float | None],
    ) -> bool:
        distance_count = sum(1 for value in distance if value is not None)
        channel_count = sum(1 for value in channel if value is not None)
        if distance_count < 20 or channel_count < 20:
            return False
        ratio = channel_count / distance_count if distance_count else 0
        return 0.25 <= ratio <= 4.0

    def channel_probe_confidence(
        self,
        label: str,
        stats: dict[str, Any],
        distance_aligned: bool,
    ) -> tuple[str, str]:
        if not distance_aligned:
            return (
                "low",
                f"{label} exists but could not be stably aligned to lap distance with current lap slicing.",
            )
        if stats["range"] is None or stats["variance"] is None:
            return ("none", f"{label} did not produce usable numeric samples.")
        if stats["range"] < 0.5 or stats["variance"] < 0.01:
            return (
                "needs-review",
                f"{label} varies too little to support reliable corridor inference.",
            )
        if label == "Path Lateral":
            if stats["hasNegative"] and stats["hasPositive"]:
                return (
                    "medium",
                    "Path Lateral crosses both negative and positive values, which suggests lateral offset semantics.",
                )
            return (
                "needs-review",
                "Path Lateral aligns with distance, but sign convention or center reference is still unclear.",
            )
        if stats["min"] is not None and stats["min"] >= 0:
            if stats["hasPositive"] and stats["range"] >= 1.0:
                return (
                    "needs-review",
                    "Track Edge aligns with distance and has a plausible positive range, but edge meaning is not yet verified.",
                )
        return (
            "low",
            f"{label} exists, but value range does not yet support a stable physical interpretation.",
        )

    def corridor_feasibility_report(
        self,
        path_lateral: dict[str, Any],
        track_edge: dict[str, Any],
    ) -> dict[str, Any]:
        path_ok = path_lateral.get("exists") and path_lateral.get("distanceAligned")
        edge_ok = track_edge.get("exists") and track_edge.get("distanceAligned")
        path_crosses_center = (
            path_lateral.get("min") is not None
            and path_lateral.get("max") is not None
            and path_lateral["min"] < 0
            and path_lateral["max"] > 0
        )
        edge_positive = track_edge.get("min") is not None and track_edge["min"] >= 0

        if path_ok and edge_ok and path_crosses_center and edge_positive:
            return {
                "verdict": "estimated-only",
                "canInferLeftRightEdges": True,
                "canInferTrackWidth": True,
                "canPlaceCarWithinTrackWidth": True,
                "reason": "Path Lateral and Track Edge both align to lap distance and suggest an estimated telemetry corridor, but actual left/right boundary semantics are not yet verified.",
            }
        if path_ok and path_crosses_center:
            return {
                "verdict": "estimated-only",
                "canInferLeftRightEdges": False,
                "canInferTrackWidth": False,
                "canPlaceCarWithinTrackWidth": True,
                "reason": "Path Lateral appears usable as an estimated in-track placement signal, but actual track width or left/right edges remain unverified.",
            }
        if path_ok or edge_ok:
            return {
                "verdict": "needs-review",
                "canInferLeftRightEdges": False,
                "canInferTrackWidth": False,
                "canPlaceCarWithinTrackWidth": False,
                "reason": "Corridor-related channels exist, but meaning, unit, or edge semantics still need more review before any surface reconstruction.",
            }
        return {
            "verdict": "not-supported",
            "canInferLeftRightEdges": False,
            "canInferTrackWidth": False,
            "canPlaceCarWithinTrackWidth": False,
            "reason": "Corridor-related channels are missing or cannot be aligned well enough for corridor inference.",
        }

    def global_corridor_verdict(
        self,
        lap_verdicts: list[str],
        blockers: list[str],
        session_reports: list[dict[str, Any]],
    ) -> dict[str, str]:
        if not lap_verdicts:
            return {
                "verdict": "not-supported",
                "reason": "No valid laps produced usable corridor probe results.",
            }
        unique_tracks = {
            (session.get("trackName"), session.get("trackLayout"))
            for session in session_reports
            if session.get("laps")
        }
        if "estimated-only" in lap_verdicts and len(unique_tracks) >= 2:
            return {
                "verdict": "estimated-only",
                "reason": "Multiple track/layout samples show corridor-related telemetry that may support an Estimated Telemetry Corridor, but not an Actual Track Boundary.",
            }
        if "needs-review" in lap_verdicts or blockers:
            return {
                "verdict": "needs-review",
                "reason": "Corridor-related channels exist, but semantics or consistency are not verified enough for track surface rendering.",
            }
        return {
            "verdict": "not-supported",
            "reason": "The current sample set does not support reliable corridor reconstruction.",
        }

    def channel_availability(self, file_path: Path) -> dict[str, bool]:
        with self.connect(file_path) as con:
            return {
                "hasGpsLat": self.table_exists(con, CHANNEL_GPS_LAT),
                "hasGpsLon": self.table_exists(con, CHANNEL_GPS_LON),
                "hasLapDist": self.table_exists(con, CHANNEL_DISTANCE),
                "hasGroundSpeed": self.table_exists(con, CHANNEL_SPEED),
                "hasBrakePos": self.table_exists(con, CHANNEL_BRAKE),
                "hasThrottlePos": self.table_exists(con, CHANNEL_THROTTLE),
                "hasSteeringPos": self.table_exists(con, CHANNEL_STEERING),
            }

    def empty_channel_report(self) -> dict[str, bool]:
        return {
            "hasGpsLat": False,
            "hasGpsLon": False,
            "hasLapDist": False,
            "hasGroundSpeed": False,
            "hasBrakePos": False,
            "hasThrottlePos": False,
            "hasSteeringPos": False,
        }

    def raw_distance_backsteps(self, session_id: str, lap_number: int) -> int:
        file_path = self.resolve_session_id(session_id)
        with self.connect(file_path) as con:
            distance = [safe_float(v) for v in self.read_table_values(con, CHANNEL_DISTANCE)]
        segment = self.segment_for_lap(distance, lap_number)
        if segment is not None:
            distance = self.slice_by_base_segment(distance, segment, len(distance))
        values = [v for v in distance if v is not None]
        return sum(1 for i in range(len(values) - 1) if values[i + 1] < values[i])

    def coordinate_bbox(self, points: list[dict[str, Any]]) -> dict[str, Any]:
        xs = [safe_float(point.get("x")) for point in points]
        ys = [safe_float(point.get("y")) for point in points]
        xs = [value for value in xs if value is not None]
        ys = [value for value in ys if value is not None]
        has_nan = any(
            safe_float(point.get(axis)) is None
            for point in points
            for axis in ("x", "y")
            if point.get(axis) is not None
        )
        if not xs or not ys:
            return {
                "minX": None,
                "maxX": None,
                "minY": None,
                "maxY": None,
                "bboxWidth": None,
                "bboxHeight": None,
                "hasNaN": has_nan,
                "hasConstantCoordinates": True,
            }
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        return {
            "minX": min_x,
            "maxX": max_x,
            "minY": min_y,
            "maxY": max_y,
            "bboxWidth": max_x - min_x,
            "bboxHeight": max_y - min_y,
            "hasNaN": has_nan,
            "hasConstantCoordinates": (max_x - min_x) == 0 or (max_y - min_y) == 0,
        }

    def coverage(self, points: list[dict[str, Any]], key: str) -> float | None:
        if not points:
            return None
        return sum(1 for point in points if point.get(key) is not None) / len(points)

    def is_monotonic(self, values: list[float]) -> bool:
        return all(values[i] <= values[i + 1] for i in range(len(values) - 1))

    def count_backsteps(self, values: list[float]) -> int:
        return sum(1 for i in range(len(values) - 1) if values[i + 1] < values[i])

    def detect_sources(self) -> list[dict[str, Any]]:
        exists = self.telemetry_folder.exists() and self.telemetry_folder.is_dir()
        warnings: list[dict[str, str]] = []
        if not exists:
            warnings.append(
                {
                    "code": "TELEMETRY_FOLDER_MISSING",
                    "message": "LMU telemetry folder was not found.",
                }
            )
        return [
            {
                "sourceId": "lmu-telemetry-folder",
                "game": self.game_id,
                "sourceKind": "duckdb-file",
                "displayName": "Le Mans Ultimate Telemetry Folder",
                "path": str(self.telemetry_folder),
                "status": "ready" if exists else "missing",
                "warnings": warnings,
            }
        ]

    def get_telemetry_folder_status(self) -> dict[str, Any]:
        exists = self.telemetry_folder.exists() and self.telemetry_folder.is_dir()
        file_count = 0
        if exists:
            file_count = len(list(self.telemetry_folder.glob("*.duckdb")))
        return {
            "path": str(self.telemetry_folder),
            "exists": exists,
            "fileCount": file_count,
            "warnings": []
            if exists
            else [
                {
                    "code": "TELEMETRY_FOLDER_MISSING",
                    "message": "LMU telemetry folder was not found.",
                }
            ],
        }

    def list_sessions(self) -> list[dict[str, Any]]:
        if not self.telemetry_folder.exists():
            raise LmuDuckDbError(
                "TELEMETRY_FOLDER_MISSING",
                "LMU telemetry folder was not found.",
                str(self.telemetry_folder),
            )

        files = [
            path
            for path in self.telemetry_folder.glob("*.duckdb")
            if not path.name.endswith(".duckdb.wal")
        ]
        files.sort(key=lambda p: p.stat().st_mtime, reverse=True)

        sessions: list[dict[str, Any]] = []
        self._sessions_by_id = {}
        for file_path in files:
            session_id = self.session_id_for_path(file_path)
            self._sessions_by_id[session_id] = file_path
            try:
                metadata = self.read_metadata(file_path)
                sessions.append(self.build_session_summary(file_path, session_id, metadata))
            except Exception as exc:  # item-level failure by design
                sessions.append(
                    self.build_error_session_summary(file_path, session_id, str(exc))
                )
        return sessions

    def load_session(self, session_id: str) -> dict[str, Any]:
        file_path = self.resolve_session_id(session_id)
        metadata = self.read_metadata(file_path)
        session = self.build_session_summary(file_path, session_id, metadata)
        laps = self.extract_laps(file_path)
        return {"session": session, "laps": laps, "warnings": []}

    def load_lap_telemetry(self, session_id: str, lap_id: str) -> dict[str, Any]:
        file_path = self.resolve_session_id(session_id)
        session_detail = self.load_session(session_id)
        lap = next((item for item in session_detail["laps"] if item["lapId"] == lap_id), None)
        if lap is None:
            raise LmuDuckDbError("LAP_NOT_FOUND", "Lap was not found.", lap_id)
        if not lap["isValid"]:
            raise LmuDuckDbError(
                "LAP_INVALID",
                "Invalid lap cannot be loaded.",
                lap.get("validityReason"),
            )

        telemetry = self.build_racing_line_view_data(
            file_path=file_path,
            session=session_detail["session"],
            lap=lap,
        )
        return telemetry

    def session_id_for_path(self, file_path: Path) -> str:
        try:
            stat = file_path.stat()
            seed = f"{file_path.resolve()}::{stat.st_size}::{int(stat.st_mtime)}"
        except OSError:
            seed = str(file_path)
        return "lmu-" + stable_id(seed)

    def resolve_session_id(self, session_id: str) -> Path:
        if session_id in self._sessions_by_id:
            return self._sessions_by_id[session_id]
        for file_path in self.telemetry_folder.glob("*.duckdb"):
            if self.session_id_for_path(file_path) == session_id:
                self._sessions_by_id[session_id] = file_path
                return file_path
        raise LmuDuckDbError("SESSION_NOT_FOUND", "Session was not found.", session_id)

    def connect(self, file_path: Path) -> duckdb.DuckDBPyConnection:
        if not file_path.exists():
            raise LmuDuckDbError("FILE_UNREADABLE", "Telemetry file was not found.", str(file_path))
        try:
            return duckdb.connect(str(file_path), read_only=True)
        except Exception as exc:
            raise self.classify_file_open_error(file_path, exc) from exc

    def list_tables(self, file_path: Path) -> list[str]:
        with self.connect(file_path) as con:
            return as_list(con.execute("SHOW TABLES").fetchall())

    def read_metadata(self, file_path: Path) -> dict[str, str]:
        with self.connect(file_path) as con:
            if not self.table_exists(con, "metadata"):
                return {}
            rows = con.execute("SELECT * FROM metadata").fetchall()
            columns = [desc[0] for desc in con.description or []]
        metadata: dict[str, str] = {}
        if len(columns) >= 2:
            for row in rows:
                key = str(row[0])
                value = "" if row[1] is None else str(row[1])
                metadata[key] = value
        return metadata

    def read_table_values(self, con: duckdb.DuckDBPyConnection, table_name: str) -> list[Any]:
        if not self.table_exists(con, table_name):
            return []
        return as_list(con.execute(f"SELECT value FROM {quote_ident(table_name)}").fetchall())

    def read_event_rows(self, con: duckdb.DuckDBPyConnection, table_name: str) -> list[tuple[Any, Any]]:
        if not self.table_exists(con, table_name):
            return []
        return con.execute(f"SELECT ts, value FROM {quote_ident(table_name)} ORDER BY ts").fetchall()

    def table_exists(self, con: duckdb.DuckDBPyConnection, table_name: str) -> bool:
        rows = con.execute(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?",
            [table_name],
        ).fetchone()
        return bool(rows and rows[0])

    def build_session_summary(
        self, file_path: Path, session_id: str, metadata: dict[str, str]
    ) -> dict[str, Any]:
        session_type = normalize_session_type(
            metadata.get("SessionType") or self.session_type_from_filename(file_path.name)
        )
        track_name = metadata.get("TrackName") or self.track_name_from_filename(file_path.name)
        layout_name = metadata.get("TrackLayout")
        car_name = metadata.get("CarName") or "Unknown Car"
        car_class = metadata.get("CarClass") or "unknown"
        stat = file_path.stat()
        return {
            "sessionId": session_id,
            "game": self.game_id,
            "sourceKind": "duckdb-file",
            "filePath": str(file_path),
            "fileName": file_path.name,
            "modifiedAt": self.iso_from_mtime(stat.st_mtime),
            "track": {
                "game": self.game_id,
                "rawTrackName": track_name,
                "rawLayoutName": layout_name,
                "displayName": track_name or "Unknown Track",
                "layoutName": layout_name,
                "source": "telemetry" if track_name else "unknown",
                "confidence": "high" if track_name else "low",
            },
            "car": {
                "game": self.game_id,
                "rawCarName": metadata.get("CarName"),
                "displayName": car_name,
                "carClass": car_class,
                "source": "telemetry" if metadata.get("CarName") else "unknown",
                "confidence": "high" if metadata.get("CarName") else "low",
            },
            "sessionType": session_type,
            "eventContext": {
                "eventType": "unknown",
                "source": "unknown",
                "confidence": "low",
            },
            "startedAt": metadata.get("RecordingTime"),
            "status": "ready",
            "warnings": self.metadata_warnings(metadata),
        }

    def build_error_session_summary(
        self, file_path: Path, session_id: str, detail: str
    ) -> dict[str, Any]:
        error_code = "FILE_CORRUPT" if self.looks_like_corrupt_file(detail) else "FILE_UNREADABLE"
        message = (
            "Telemetry file appears to be corrupt."
            if error_code == "FILE_CORRUPT"
            else "Telemetry file could not be read."
        )
        return {
            "sessionId": session_id,
            "game": self.game_id,
            "sourceKind": "duckdb-file",
            "filePath": str(file_path),
            "fileName": file_path.name,
            "modifiedAt": self.iso_from_mtime(file_path.stat().st_mtime),
            "track": {
                "game": self.game_id,
                "displayName": self.track_name_from_filename(file_path.name) or "Unknown Track",
                "source": "unknown",
                "confidence": "low",
            },
            "car": {
                "game": self.game_id,
                "displayName": "Unknown Car",
                "source": "unknown",
                "confidence": "low",
            },
            "sessionType": normalize_session_type(self.session_type_from_filename(file_path.name)),
            "status": "error",
            "warnings": [
                {
                    "code": error_code,
                    "message": message,
                    "detail": detail,
                }
            ],
        }

    def extract_laps(self, file_path: Path) -> list[dict[str, Any]]:
        with self.connect(file_path) as con:
            lap_rows = self.read_event_rows(con, EVENT_LAP)
            lap_time_rows = self.read_event_rows(con, EVENT_LAP_TIME)
            distance_values = [safe_float(v) for v in self.read_table_values(con, CHANNEL_DISTANCE)]
            distance_segments = self.detect_distance_segments(distance_values)

        boundaries = [safe_float(row[0]) for row in lap_rows]
        boundaries = [value for value in boundaries if value is not None]
        lap_times = [safe_float(row[1]) for row in lap_time_rows]

        lap_count = max(len(lap_times), max(0, len(boundaries) - 1))
        laps: list[dict[str, Any]] = []
        for index in range(lap_count):
            lap_time = lap_times[index] if index < len(lap_times) else None
            start_time = boundaries[index] if index < len(boundaries) else None
            end_time = boundaries[index + 1] if index + 1 < len(boundaries) else None
            warnings: list[dict[str, str]] = []
            validity_reason = None
            is_valid = True
            if lap_time is None:
                is_valid = False
                validity_reason = "Lap Time event is missing."
                warnings.append(
                    {"code": "LAP_TIME_MISSING", "message": "Lap Time event is missing."}
                )
            elif lap_time <= 0:
                is_valid = False
                validity_reason = "Lap Time is zero or negative."
            if start_time is None or end_time is None:
                # Practice files can have incomplete Lap events. Keep lap valid if lap time exists,
                # but mark the boundary as ambiguous for the prototype.
                warnings.append(
                    {
                        "code": "LAP_BOUNDARY_AMBIGUOUS",
                        "message": "Lap event boundary is missing or incomplete.",
                    }
                )
            laps.append(
                {
                    "lapId": f"lap-{index}",
                    "lapNumber": index,
                    "lapTimeMs": self.seconds_to_ms(lap_time),
                    "isValid": is_valid,
                    "isBest": False,
                    "lapKind": "race-lap" if is_valid else "invalid",
                    "startTimeMs": self.seconds_to_ms(start_time),
                    "endTimeMs": self.seconds_to_ms(end_time),
                    "distanceM": self.segment_lap_distance(distance_values, distance_segments, index),
                    "validityReason": validity_reason,
                    "warnings": warnings,
                }
            )

        valid_laps = [lap for lap in laps if lap["isValid"] and lap["lapTimeMs"] is not None]
        if valid_laps:
            best_lap = min(valid_laps, key=lambda lap: lap["lapTimeMs"])
            best_lap["isBest"] = True
        return laps

    def build_racing_line_view_data(
        self,
        file_path: Path,
        session: dict[str, Any],
        lap: dict[str, Any],
    ) -> dict[str, Any]:
        with self.connect(file_path) as con:
            distance = [safe_float(v) for v in self.read_table_values(con, CHANNEL_DISTANCE)]
            if not any(v is not None for v in distance):
                raise LmuDuckDbError(
                    "MISSING_DISTANCE",
                    "Lap distance channel is missing or empty.",
                    CHANNEL_DISTANCE,
                )

            lat = [safe_float(v) for v in self.read_table_values(con, CHANNEL_GPS_LAT)]
            lon = [safe_float(v) for v in self.read_table_values(con, CHANNEL_GPS_LON)]
            speed = [safe_float(v) for v in self.read_table_values(con, CHANNEL_SPEED)]
            rpm = [safe_float(v) for v in self.read_table_values(con, CHANNEL_RPM)]
            brake = [normalize_percent(v) for v in self.read_table_values(con, CHANNEL_BRAKE)]
            throttle = [
                normalize_percent(v) for v in self.read_table_values(con, CHANNEL_THROTTLE)
            ]
            steering = [
                normalize_percent(v) for v in self.read_table_values(con, CHANNEL_STEERING)
            ]
            gear_rows = self.read_event_rows(con, EVENT_GEAR)

        if self.fixture_options.force_no_coordinates:
            lat = []
            lon = []

        lap_index = int(lap["lapNumber"])
        segment = self.segment_for_lap(distance, lap_index)
        if segment is not None:
            distance = self.slice_by_base_segment(distance, segment, len(distance))
            lat = self.slice_by_base_segment(lat, segment, len(distance), original_base_len=None)
            lon = self.slice_by_base_segment(lon, segment, len(distance), original_base_len=None)
            original_distance_len = segment[2] if len(segment) >= 3 else None
        else:
            original_distance_len = None

        distance = self.clean_lap_distance(distance)

        # Re-slice higher frequency channels using the original full-session distance index range.
        if segment is not None and original_distance_len:
            speed = self.slice_by_base_segment(speed, segment, original_distance_len)
            rpm = self.slice_by_base_segment(rpm, segment, original_distance_len)
            brake = self.slice_by_base_segment(brake, segment, original_distance_len)
            throttle = self.slice_by_base_segment(throttle, segment, original_distance_len)
            steering = self.slice_by_base_segment(steering, segment, original_distance_len)

        gear = self.build_gear_samples(distance, gear_rows, lap)

        warnings: list[dict[str, str]] = []
        valid_distance = [v for v in distance if v is not None]
        has_coordinates = bool(lat and lon and any(v is not None for v in lat) and any(v is not None for v in lon))
        coordinate_reason = (
            "Stable GPS Latitude/Longitude pair found and projected into lap-local planar coordinates."
        )
        if not has_coordinates:
            warning_detail = None
            coordinate_reason = "No usable coordinate channels were found."
            if self.fixture_options.force_no_coordinates:
                warning_detail = "Fixture mode forced GPS coordinates to be unavailable."
                coordinate_reason = "Fixture mode forced coordinates to be unavailable."
            warnings.append(
                {
                    "code": "NO_COORDINATES",
                    "message": "Coordinate data is missing. Showing distance-based graphs only.",
                    **({"detail": warning_detail} if warning_detail else {}),
                }
            )

        channel_warnings = self.partial_channel_warnings(
            {
                "speedKph": speed,
                "brake01": brake,
                "throttle01": throttle,
                "steering01": steering,
            }
        )
        warnings.extend(channel_warnings)

        graph_points = self.build_graph_points(
            distance=distance,
            speed=speed,
            rpm=rpm,
            brake=brake,
            throttle=throttle,
            steering=steering,
            gear=gear,
        )

        racing_line: list[dict[str, Any]] = []
        if has_coordinates:
            racing_line = self.build_racing_line_points(
                distance=distance,
                lat=lat,
                lon=lon,
                speed=speed,
                brake=brake,
                throttle=throttle,
            )

        mode = "real-racing-line" if racing_line else "distance-graph-only"
        return {
            "session": session,
            "lap": lap,
            "mode": mode,
            "coordinateStatus": {
                "hasCoordinates": bool(racing_line),
                "source": "gps-lat-lon" if racing_line else "none",
                "renderMapping": "gps-projected" if racing_line else "none",
                "confidence": "high" if racing_line else "none",
                "coordinateUnit": "projected-meter" if racing_line else "unknown",
                "reason": coordinate_reason,
            },
            "sync": {
                "preferredAxis": "distance",
                "hasDistance": True,
                "distanceConfidence": "high" if len(valid_distance) > 10 else "medium",
                "reason": f"{CHANNEL_DISTANCE} channel found.",
            },
            "racingLine": racing_line,
            "graphPoints": graph_points,
            "warnings": warnings,
        }

    def detect_distance_segments(
        self, distance_values: list[float | None]
    ) -> list[tuple[int, int, int]]:
        if not distance_values:
            return []
        segments: list[tuple[int, int, int]] = []
        start = 0
        previous = distance_values[0]
        full_len = len(distance_values)
        for index in range(1, full_len):
            current = distance_values[index]
            if previous is not None and current is not None:
                # LMU Lap Dist resets near lap start. A drop larger than 50m is
                # enough to avoid noise while catching lap boundary resets.
                if current + 50.0 < previous:
                    if index - start > 5:
                        segments.append((start, index, full_len))
                    start = index
            if current is not None:
                previous = current
        if full_len - start > 5:
            segments.append((start, full_len, full_len))
        return segments

    def segment_for_lap(
        self, distance_values: list[float | None], lap_index: int
    ) -> tuple[int, int, int] | None:
        segments = self.detect_distance_segments(distance_values)
        if 0 <= lap_index < len(segments):
            return segments[lap_index]
        return None

    def segment_lap_distance(
        self,
        distance_values: list[float | None],
        segments: list[tuple[int, int, int]],
        lap_index: int,
    ) -> float | None:
        if 0 <= lap_index < len(segments):
            start, end, _ = segments[lap_index]
            values = [v for v in distance_values[start:end] if v is not None]
            if values:
                return max(values)
        values = [v for v in distance_values if v is not None]
        return max(values) if values else None

    def slice_by_base_segment(
        self,
        values: list[Any],
        segment: tuple[int, int, int],
        base_len: int,
        original_base_len: int | None = None,
    ) -> list[Any]:
        if not values:
            return []
        start, end, full_base_len = segment
        source_base_len = original_base_len or full_base_len
        if source_base_len <= 0:
            return values
        if len(values) == source_base_len:
            return values[start:end]
        ratio_start = start / source_base_len
        ratio_end = end / source_base_len
        value_start = max(0, min(len(values), int(math.floor(ratio_start * len(values)))))
        value_end = max(value_start, min(len(values), int(math.ceil(ratio_end * len(values)))))
        return values[value_start:value_end]

    def clean_lap_distance(self, distance_values: list[float | None]) -> list[float | None]:
        cleaned: list[float | None] = []
        previous: float | None = None
        for value in distance_values:
            if value is None:
                cleaned.append(None)
                continue
            if previous is not None and value < previous:
                # Lap Dist can jitter backwards by a few meters in real files.
                # Phase 1 graph/canvas sync requires a non-decreasing distance axis.
                value = previous
            cleaned.append(value)
            previous = value
        return cleaned

    def build_graph_points(
        self,
        distance: list[float | None],
        speed: list[float | None],
        rpm: list[float | None],
        brake: list[float | None],
        throttle: list[float | None],
        steering: list[float | None],
        gear: list[int | None],
    ) -> list[dict[str, Any]]:
        points: list[dict[str, Any]] = []
        for index, distance_m in enumerate(distance):
            if distance_m is None:
                continue
            point: dict[str, Any] = {"distanceM": distance_m}
            self.set_sampled(point, "speedKph", speed, index, len(distance))
            self.set_sampled(point, "rpm", rpm, index, len(distance))
            self.set_sampled(point, "brake01", brake, index, len(distance))
            self.set_sampled(point, "throttle01", throttle, index, len(distance))
            self.set_sampled(point, "steering01", steering, index, len(distance))
            self.set_sampled(point, "gear", gear, index, len(distance))
            points.append(point)
        return points

    def build_gear_samples(
        self,
        distance: list[float | None],
        gear_rows: list[tuple[Any, Any]],
        lap: dict[str, Any],
    ) -> list[int | None]:
        if not distance or not gear_rows:
            return []

        start_time_ms = safe_float(lap.get("startTimeMs"))
        end_time_ms = safe_float(lap.get("endTimeMs"))
        if start_time_ms is None or end_time_ms is None or end_time_ms <= start_time_ms:
            return []

        start_time_s = start_time_ms / 1000.0
        end_time_s = end_time_ms / 1000.0
        lap_duration_s = end_time_s - start_time_s
        if lap_duration_s <= 0:
            return []

        valid_events: list[tuple[float, int]] = []
        for ts_raw, value_raw in gear_rows:
            ts = safe_float(ts_raw)
            gear_value = self.normalize_gear_value(value_raw)
            if ts is None or gear_value is None:
                continue
            if ts < start_time_s or ts > end_time_s:
                continue
            valid_events.append((ts, gear_value))

        if not valid_events:
            return []

        sample_count = len(distance)
        gear_values: list[int | None] = [None] * sample_count
        for ts, gear_value in valid_events:
            ratio = (ts - start_time_s) / lap_duration_s
            ratio = max(0.0, min(1.0, ratio))
            target_index = round(ratio * max(sample_count - 1, 0))
            gear_values[target_index] = gear_value

        last_gear = valid_events[0][1]
        for index in range(sample_count):
            if gear_values[index] is None:
                gear_values[index] = last_gear
            else:
                last_gear = gear_values[index]
        return gear_values

    def normalize_gear_value(self, value: Any) -> int | None:
        number = safe_float(value)
        if number is None:
            return None
        return int(round(number))

    def build_racing_line_points(
        self,
        distance: list[float | None],
        lat: list[float | None],
        lon: list[float | None],
        speed: list[float | None],
        brake: list[float | None],
        throttle: list[float | None],
    ) -> list[dict[str, Any]]:
        points: list[dict[str, Any]] = []
        count = min(len(distance), len(lat), len(lon))
        valid_lat = [value for value in lat[:count] if value is not None]
        mean_lat = sum(valid_lat) / len(valid_lat) if valid_lat else 0.0
        scale_x = 111_320.0 * math.cos(math.radians(mean_lat))
        scale_y = 110_540.0
        origin_lat = next((value for value in lat if value is not None), 0.0)
        origin_lon = next((value for value in lon if value is not None), 0.0)

        for index in range(count):
            distance_m = distance[index]
            lat_value = lat[index]
            lon_value = lon[index]
            if distance_m is None or lat_value is None or lon_value is None:
                continue
            point: dict[str, Any] = {
                "distanceM": distance_m,
                "x": (lon_value - origin_lon) * scale_x,
                "y": (lat_value - origin_lat) * scale_y,
            }
            self.set_sampled(point, "speedKph", speed, index, count)
            self.set_sampled(point, "brake01", brake, index, count)
            self.set_sampled(point, "throttle01", throttle, index, count)
            points.append(point)
        return points

    def set_sampled(
        self,
        point: dict[str, Any],
        key: str,
        values: list[float | None],
        base_index: int,
        base_len: int,
    ) -> None:
        if not values:
            return
        if base_len <= 1:
            value_index = 0
        else:
            value_index = round(base_index * (len(values) - 1) / (base_len - 1))
        if 0 <= value_index < len(values):
            value = values[value_index]
            if value is not None:
                point[key] = value

    def partial_channel_warnings(
        self, channels: dict[str, list[float | None]]
    ) -> list[dict[str, str]]:
        warnings: list[dict[str, str]] = []
        missing = [name for name, values in channels.items() if not any(v is not None for v in values)]
        if missing:
            warnings.append(
                {
                    "code": "PARTIAL_CHANNELS",
                    "message": "Some graph channels are missing.",
                    "detail": ", ".join(missing),
                }
            )
        return warnings

    def metadata_warnings(self, metadata: dict[str, str]) -> list[dict[str, str]]:
        missing = [
            key
            for key in ["TrackName", "TrackLayout", "SessionType", "CarName", "CarClass"]
            if not metadata.get(key)
        ]
        if not missing:
            return []
        return [
            {
                "code": "METADATA_MISSING",
                "message": "Some session metadata fields are missing.",
                "detail": ", ".join(missing),
            }
        ]

    def looks_like_corrupt_file(self, detail: str | None) -> bool:
        text = (detail or "").lower()
        return any(
            marker in text
            for marker in (
                "not a valid duckdb",
                "invalid database",
                "corrupt",
                "checksum",
                "magic bytes",
                "serialization",
            )
        )

    def classify_file_open_error(self, file_path: Path, exc: Exception) -> LmuDuckDbError:
        detail = str(exc)
        if self.looks_like_corrupt_file(detail):
            return LmuDuckDbError(
                "FILE_CORRUPT",
                "Telemetry file appears to be corrupt.",
                f"{file_path}: {detail}",
            )
        return LmuDuckDbError(
            "FILE_UNREADABLE",
            "Telemetry file could not be read.",
            f"{file_path}: {detail}",
        )

    def session_type_from_filename(self, file_name: str) -> str | None:
        parts = file_name.split("_")
        if len(parts) >= 2 and parts[-2] in {"P", "Q", "R"}:
            return parts[-2]
        return None

    def track_name_from_filename(self, file_name: str) -> str | None:
        if "_" in file_name:
            return file_name.split("_", 1)[0]
        return Path(file_name).stem

    def seconds_to_ms(self, value: float | None) -> int | None:
        if value is None:
            return None
        # LMU Lap Time probe values are seconds in samples checked.
        return int(round(value * 1000))

    def iso_from_mtime(self, mtime: float) -> str:
        from datetime import datetime, timezone

        return datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()


def adapter_from_args(args: argparse.Namespace) -> LmuDuckDbAdapter:
    return LmuDuckDbAdapter(telemetry_folder=args.folder)


def print_json(payload: Any) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def print_validation_table(report: dict[str, Any]) -> None:
    summary = report["summary"]
    print("Brakepoint LMU validation")
    print(f"source: {report['sourcePath']}")
    print(
        "summary: "
        f"files={summary['filesScanned']} "
        f"ready={summary['sessionsReady']} "
        f"errors={summary['sessionsError']} "
        f"laps={summary['totalLaps']} "
        f"valid={summary['validLaps']} "
        f"invalid={summary['invalidLaps']} "
        f"realLine={summary['realRacingLineLaps']} "
        f"graphOnly={summary['distanceGraphOnlyLaps']} "
        f"missingDistance={summary['missingDistanceLaps']}"
    )
    print("")
    header = (
        "file | track/layout | type | laps v/i | best | "
        "channels | first valid lap | mode | points | maxD | bbox | raw/fixed | warnings"
    )
    print(header)
    print("-" * len(header))
    for session in report["sessions"]:
        channels = session.get("channels", {})
        channel_bits = "".join(
            [
                "G" if channels.get("hasGpsLat") and channels.get("hasGpsLon") else "-",
                "D" if channels.get("hasLapDist") else "-",
                "S" if channels.get("hasGroundSpeed") else "-",
                "B" if channels.get("hasBrakePos") else "-",
                "T" if channels.get("hasThrottlePos") else "-",
                "R" if channels.get("hasSteeringPos") else "-",
            ]
        )
        first_valid = next((lap for lap in session.get("laps", []) if lap.get("isValid")), None)
        if first_valid:
            coords = first_valid.get("coordinates", {})
            bbox = "-"
            if coords.get("bboxWidth") is not None and coords.get("bboxHeight") is not None:
                bbox = f"{coords['bboxWidth']:.0f}x{coords['bboxHeight']:.0f}"
            lap_text = first_valid.get("lapId")
            mode = first_valid.get("mode", "-")
            points = f"{first_valid.get('pointCount', 0)}/{first_valid.get('graphPointCount', 0)}"
            max_d = first_valid.get("distance", {}).get("maxM")
            max_d_text = f"{max_d:.1f}" if max_d is not None else "-"
            distance_report = first_valid.get("distance", {})
            raw_backsteps = distance_report.get("rawDistanceBacksteps", 0)
            fixed_backsteps = distance_report.get("repairedDistanceBacksteps", 0)
            repairs = f"{raw_backsteps}/{fixed_backsteps}"
            warning_count = len(first_valid.get("warnings", []))
        else:
            bbox = "-"
            lap_text = "-"
            mode = "-"
            points = "-"
            max_d_text = "-"
            repairs = "-"
            warning_count = len(session.get("warnings", []))
        print(
            f"{session.get('fileName')} | "
            f"{session.get('trackName')}/{session.get('trackLayout')} | "
            f"{session.get('sessionType')} | "
            f"{session.get('validLapCount')}/{session.get('invalidLapCount')} | "
            f"{session.get('bestLapId') or '-'} | "
            f"{channel_bits} | "
            f"{lap_text} | {mode} | {points} | {max_d_text} | {bbox} | {repairs} | {warning_count}"
        )


def print_track_corridor_table(report: dict[str, Any]) -> None:
    print("Brakepoint LMU track corridor probe")
    print(
        "summary: "
        f"sessions={report['sessionsScanned']} "
        f"laps={report['lapsScanned']} "
        f"verdict={report['globalVerdict']['verdict']}"
    )
    print(f"reason: {report['globalVerdict']['reason']}")
    print("")
    header = (
        "file | track/layout | lap | line | path lateral | track edge | corridor"
    )
    print(header)
    print("-" * len(header))
    for session in report["sessions"]:
        for lap in session.get("laps", []):
            path_lateral = lap.get("pathLateral", {})
            track_edge = lap.get("trackEdge", {})
            racing_line = lap.get("racingLine", {})
            print(
                f"{session.get('fileName')} | "
                f"{session.get('trackName')}/{session.get('trackLayout')} | "
                f"{lap.get('lapId')} | "
                f"{racing_line.get('pointCount', 0)}pts {format_optional(racing_line.get('maxDistanceM'))}m | "
                f"{compact_channel_probe(path_lateral)} | "
                f"{compact_channel_probe(track_edge)} | "
                f"{lap.get('corridorFeasibility', {}).get('verdict')}"
            )


def print_track_edge_semantics_table(report: dict[str, Any]) -> None:
    print("Brakepoint LMU track edge semantics probe")
    print(
        "summary: "
        f"sessions={report['sessionsScanned']} "
        f"laps={report['lapsScanned']} "
        f"verdict={report['globalVerdict']['verdict']}"
    )
    print(f"reason: {report['globalVerdict']['reason']}")
    print("")
    header = "file | track/layout | lap | path | edge | corr | verdict"
    print(header)
    print("-" * len(header))
    for session in report["sessions"]:
        for lap in session.get("laps", []):
            path_report = lap.get("pathLateral", {})
            edge_report = lap.get("trackEdge", {})
            corr = lap.get("correlation", {})
            corr_text = format_optional(corr.get("pearson"))
            print(
                f"{session.get('fileName')} | "
                f"{session.get('trackName')}/{session.get('trackLayout')} | "
                f"{lap.get('lapId')} | "
                f"{compact_distribution(path_report)} | "
                f"{compact_distribution(edge_report)} | "
                f"{corr_text} ({corr.get('confidence')}) | "
                f"{lap.get('semanticsVerdict', {}).get('verdict')}"
            )


def compact_channel_probe(report: dict[str, Any]) -> str:
    if not report.get("exists"):
        return "missing"
    minimum = format_optional(report.get("min"))
    maximum = format_optional(report.get("max"))
    aligned = "Y" if report.get("distanceAligned") else "N"
    return f"{report.get('confidence')} {aligned} [{minimum},{maximum}]"


def compact_distribution(report: dict[str, Any]) -> str:
    if not report.get("exists"):
        return "missing"
    return (
        f"[{format_optional(report.get('min'))},{format_optional(report.get('max'))}] "
        f"+{format_optional_ratio(report.get('positiveRatio'))} "
        f"-{format_optional_ratio(report.get('negativeRatio'))}"
    )


def format_optional(value: Any) -> str:
    number = safe_float(value)
    if number is None:
        return "-"
    return f"{number:.2f}"


def format_optional_ratio(value: Any) -> str:
    number = safe_float(value)
    if number is None:
        return "-"
    return f"{number:.2f}"


def main(argv: list[str] | None = None) -> int:
    try:
        import sys

        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

    parser = argparse.ArgumentParser(description="Brakepoint LMU DuckDB adapter CLI")
    parser.add_argument("--folder")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("detect-sources")
    sub.add_parser("folder-status")
    sub.add_parser("list-sessions")
    load_session = sub.add_parser("load-session")
    load_session.add_argument("session_id")
    load_lap = sub.add_parser("load-lap")
    load_lap.add_argument("session_id")
    load_lap.add_argument("lap_id")
    validate = sub.add_parser("validate")
    validate.add_argument("--limit", type=int)
    validate.add_argument("--session")
    validate.add_argument("--file")
    validate.add_argument("--json", action="store_true")
    validate.add_argument("--output")
    corridor = sub.add_parser("track-corridor-probe")
    corridor.add_argument("--limit", type=int)
    corridor.add_argument("--session")
    corridor.add_argument("--file")
    corridor.add_argument("--json", action="store_true")
    corridor.add_argument("--output")
    edge_semantics = sub.add_parser("track-edge-semantics-probe")
    edge_semantics.add_argument("--limit", type=int)
    edge_semantics.add_argument("--session")
    edge_semantics.add_argument("--file")
    edge_semantics.add_argument("--json", action="store_true")
    edge_semantics.add_argument("--output")
    sub.add_parser("capabilities")

    args = parser.parse_args(argv)
    adapter = adapter_from_args(args)
    try:
        if args.command == "detect-sources":
            print_json(ok(adapter.detect_sources()))
        elif args.command == "folder-status":
            print_json(ok(adapter.get_telemetry_folder_status()))
        elif args.command == "list-sessions":
            print_json(ok(adapter.list_sessions()))
        elif args.command == "load-session":
            adapter.list_sessions()
            print_json(ok(adapter.load_session(args.session_id)))
        elif args.command == "load-lap":
            adapter.list_sessions()
            print_json(ok(adapter.load_lap_telemetry(args.session_id, args.lap_id)))
        elif args.command == "validate":
            report = adapter.validate(
                limit=args.limit,
                session_id=args.session,
                file_path=args.file,
            )
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_text(
                    json.dumps(report, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
            if args.json or args.output:
                print_json(ok(report))
            else:
                print_validation_table(report)
        elif args.command == "track-corridor-probe":
            report = adapter.track_corridor_probe(
                limit=args.limit,
                session_id=args.session,
                file_path=args.file,
            )
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_text(
                    json.dumps(report, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
            if args.json or args.output:
                print_json(ok(report))
            else:
                print_track_corridor_table(report)
        elif args.command == "track-edge-semantics-probe":
            report = adapter.track_edge_semantics_probe(
                limit=args.limit,
                session_id=args.session,
                file_path=args.file,
            )
            if args.output:
                output_path = Path(args.output)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_text(
                    json.dumps(report, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
            if args.json or args.output:
                print_json(ok(report))
            else:
                print_track_edge_semantics_table(report)
        elif args.command == "capabilities":
            print_json(ok(adapter.get_capabilities()))
    except LmuDuckDbError as exc:
        print_json({"ok": False, "error": exc.to_api_error()})
        return 1
    except Exception as exc:  # CLI safety net
        print_json(err("UNKNOWN_ERROR", "Unexpected adapter failure.", str(exc)))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
