#!/usr/bin/env python3
"""Small private snapshot API for BucRater.

The desktop application keeps a local SQLite cache and synchronizes the complete
library through this service. The service stores the canonical snapshot in a
SQLite database and uses optimistic revisions to avoid silently overwriting a
change made by another device.
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

# A library may contain many embedded cover images. Individual covers are limited
# by the client, while the server allows a reasonably sized complete snapshot.
MAX_BODY_BYTES = 128 * 1024 * 1024


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class SnapshotConflict(Exception):
    def __init__(self, snapshot: dict[str, Any]) -> None:
        super().__init__("la biblioteca del servidor ha cambiado")
        self.snapshot = snapshot


class SnapshotStore:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(path, check_same_thread=False)
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS library_snapshot (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                revision INTEGER NOT NULL,
                data_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        self.connection.commit()
        self.lock = threading.RLock()

    def get(self) -> dict[str, Any]:
        with self.lock:
            row = self.connection.execute(
                "SELECT revision, data_json FROM library_snapshot WHERE id = 1"
            ).fetchone()
        if row is None:
            return {"revision": 0, "data": None}
        return {"revision": row[0], "data": json.loads(row[1])}

    def put(self, base_revision: int | None, data: dict[str, Any]) -> dict[str, Any]:
        with self.lock:
            current = self.connection.execute(
                "SELECT revision FROM library_snapshot WHERE id = 1"
            ).fetchone()
            current_revision = current[0] if current else None
            if current_revision != base_revision:
                raise SnapshotConflict(self.get())

            revision = (current_revision or 0) + 1
            payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
            self.connection.execute(
                """
                INSERT INTO library_snapshot (id, revision, data_json, updated_at)
                VALUES (1, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    revision = excluded.revision,
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at
                """,
                (revision, payload, utc_now()),
            )
            self.connection.commit()
        return {"revision": revision, "data": data}


def valid_snapshot(data: Any) -> bool:
    return (
        isinstance(data, dict)
        and isinstance(data.get("tags"), list)
        and isinstance(data.get("books"), list)
    )


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "BucRaterServer/1.0"

    @property
    def store(self) -> SnapshotStore:
        return self.server.store  # type: ignore[attr-defined]

    def log_message(self, format: str, *args: object) -> None:
        print(f"{self.address_string()} - {format % args}", flush=True)

    def send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def is_authorized(self) -> bool:
        expected = os.environ.get("BUCRATER_SERVER_TOKEN", "").strip()
        if not expected:
            return True
        return self.headers.get("Authorization") == f"Bearer {expected}"

    def require_auth(self) -> bool:
        if self.is_authorized():
            return True
        self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "no autorizado"})
        return False

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self.send_json(HTTPStatus.OK, {"status": "ok", "service": "bucrater"})
            return
        if self.path != "/api/v1/snapshot" or not self.require_auth():
            if self.path != "/api/v1/snapshot" and not self.path == "/health":
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "ruta no encontrada"})
            return
        self.send_json(HTTPStatus.OK, self.store.get())

    def do_PUT(self) -> None:  # noqa: N802
        if self.path != "/api/v1/snapshot" or not self.require_auth():
            if self.path != "/api/v1/snapshot":
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "ruta no encontrada"})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self.send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "payload no válido"})
            return
        try:
            payload = json.loads(self.rfile.read(content_length))
            base_revision = payload.get("baseRevision")
            data = payload.get("data")
            if base_revision is not None and not isinstance(base_revision, int):
                raise ValueError("baseRevision no válido")
            if not valid_snapshot(data):
                raise ValueError("snapshot no válido")
            result = self.store.put(base_revision, data)
        except SnapshotConflict as conflict:
            self.send_json(HTTPStatus.CONFLICT, conflict.snapshot)
            return
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return
        except sqlite3.Error as error:
            self.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
            return
        self.send_json(HTTPStatus.OK, result)


def main() -> None:
    parser = argparse.ArgumentParser(description="API privada de sincronización de BucRater")
    parser.add_argument("--host", default=os.environ.get("BUCRATER_SERVER_HOST", "100.74.38.58"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("BUCRATER_SERVER_PORT", "8092")))
    parser.add_argument(
        "--database",
        type=Path,
        default=Path(os.environ.get("BUCRATER_SERVER_DATABASE", "/var/lib/bucrater-server/bucrater.db")),
    )
    args = parser.parse_args()

    httpd = ThreadingHTTPServer((args.host, args.port), RequestHandler)
    httpd.store = SnapshotStore(args.database)  # type: ignore[attr-defined]
    print(f"BucRater server escuchando en http://{args.host}:{args.port}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
