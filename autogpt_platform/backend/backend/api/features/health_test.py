"""Tests for the ``/health/status`` readiness endpoint."""

import asyncio
from unittest.mock import AsyncMock

import fastapi
import fastapi.testclient
import pytest
import pytest_mock

from . import health

app = fastapi.FastAPI()
app.include_router(health.router, prefix="/health")

client = fastapi.testclient.TestClient(app)


@pytest.fixture
def all_up(mocker: pytest_mock.MockFixture) -> None:
    mocker.patch("backend.data.db.is_connected", return_value=True)
    mocker.patch.object(health, "_check_redis", AsyncMock(return_value="ok"))
    mocker.patch.object(health, "_check_tcp", AsyncMock(return_value="ok"))
    mocker.patch.object(health, "_check_http", AsyncMock(return_value="ok"))
    mocker.patch.dict("os.environ", {"AGPT_BACKEND_VERSION": "0.2.0"})


def test_all_services_up(all_up: None) -> None:
    response = client.get("/health/status")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["version"] == "0.2.0"
    assert set(body["services"]) == {
        "database",
        "redis",
        "rabbitmq",
        "websocket",
        "executor",
        "scheduler",
        "database_manager",
        "notification",
    }
    assert set(body["services"].values()) == {"ok"}


def test_service_down_returns_503(
    all_up: None, mocker: pytest_mock.MockFixture
) -> None:
    mocker.patch.object(
        health, "_check_redis", AsyncMock(side_effect=ConnectionError("refused"))
    )

    response = client.get("/health/status")

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "degraded"
    assert body["services"]["redis"] == "down"
    assert body["services"]["database"] == "ok"


def test_slow_probe_counts_as_down(
    all_up: None, mocker: pytest_mock.MockFixture
) -> None:
    async def hang(*_args: object) -> str:
        await asyncio.sleep(60)
        return "ok"

    mocker.patch.object(health, "PROBE_TIMEOUT_SECONDS", 0.05)
    mocker.patch.object(health, "_check_tcp", hang)

    response = client.get("/health/status")

    assert response.status_code == 503
    assert response.json()["services"]["rabbitmq"] == "down"
