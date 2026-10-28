"""``GET /health/status`` – readiness of every backend service, for single-host installs.

``GET /health`` only says the REST server is up and connected to Postgres. A local
install (the AutoGPT Desktop backend container) also needs the executor, scheduler,
WebSocket server and the other services before it is usable, so the desktop app polls
this while the backend starts. Services are looked up like the backend's own service
clients do: ``<SERVICE>_HOST`` (default ``PYRO_HOST``) and their configured ports.

Unauthenticated: it only reveals service names, their state and the version.
"""

import asyncio
import os
from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as package_version
from typing import Awaitable, Literal

import aiohttp
from fastapi import APIRouter, Response
from pydantic import BaseModel

import backend.data.db
from backend.data import redis_client
from backend.util.settings import Config

PROBE_TIMEOUT_SECONDS = 2.0

ServiceState = Literal["ok", "down"]


class HealthStatus(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    services: dict[str, ServiceState]


router = APIRouter(tags=["health"])


def backend_version() -> str:
    if image_version := os.getenv("AGPT_BACKEND_VERSION"):
        return image_version
    try:
        return package_version("autogpt-platform-backend")
    except PackageNotFoundError:
        return "unknown"


def _service_urls(config: Config) -> dict[str, str]:
    def host(service_class: str) -> str:
        return os.getenv(f"{service_class.upper()}_HOST") or config.pyro_host

    return {
        "websocket": f"http://{host('WebsocketServer')}:{config.websocket_server_port}/health",
        # The executor only serves Prometheus metrics; any answer means it's up
        "executor": f"http://{host('ExecutionManager')}:{config.execution_manager_port}/",
        "scheduler": f"http://{host('Scheduler')}:{config.execution_scheduler_port}/health_check",
        "database_manager": f"http://{host('DatabaseManager')}:{config.database_api_port}/health_check",
        "notification": f"http://{host('NotificationManager')}:{config.notification_service_port}/health_check",
    }


async def _check_http(session: aiohttp.ClientSession, url: str) -> ServiceState:
    async with session.get(url) as response:
        return "ok" if response.ok else "down"


async def _check_redis() -> ServiceState:
    client = await redis_client.get_redis_async()
    await client.ping()
    return "ok"


async def _check_tcp(host: str, port: int) -> ServiceState:
    _, writer = await asyncio.open_connection(host, port)
    writer.close()
    await writer.wait_closed()
    return "ok"


async def _probe(check: Awaitable[ServiceState]) -> ServiceState:
    try:
        return await asyncio.wait_for(check, PROBE_TIMEOUT_SECONDS)
    except Exception:
        return "down"


@router.get(
    "/status",
    summary="Readiness of all backend services",
    response_model=HealthStatus,
    responses={503: {"model": HealthStatus}},
    include_in_schema=False,
)
async def health_status(response: Response) -> HealthStatus:
    config = Config()
    urls = _service_urls(config)
    timeout = aiohttp.ClientTimeout(total=PROBE_TIMEOUT_SECONDS)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        redis, rabbitmq, *http = await asyncio.gather(
            _probe(_check_redis()),
            _probe(_check_tcp(config.rabbitmq_host, config.rabbitmq_port)),
            *(_probe(_check_http(session, url)) for url in urls.values()),
        )

    services: dict[str, ServiceState] = {
        "database": "ok" if backend.data.db.is_connected() else "down",
        "redis": redis,
        "rabbitmq": rabbitmq,
        **dict(zip(urls, http)),
    }
    healthy = all(state == "ok" for state in services.values())
    if not healthy:
        response.status_code = 503
    return HealthStatus(
        status="ok" if healthy else "degraded",
        version=backend_version(),
        services=services,
    )
