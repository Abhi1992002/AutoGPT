"""Seed a per-PR preview environment with a usable demo account.

Run as the one-shot ``seed`` service in ``docker-compose.preview.yml`` (after
``migrate`` completes). Idempotent: safe to re-run on every deploy.

What it does:
  1. Creates a confirmed Supabase (GoTrue) auth user so a reviewer can log in.
  2. Mirrors it as a platform ``User`` row (id == Supabase user id).
  3. Grants demo credits so agents can actually run.
  4. Best-effort: loads ``graph_templates/preview_demo.json`` and creates a
     demo agent so the app isn't empty. Any failure here is logged and skipped
     — a funded, logged-in account is the hard requirement, the demo graph is not.

Env vars:
  SUPABASE_URL                 internal Supabase gateway (e.g. http://kong:8000)
  SUPABASE_SERVICE_ROLE_KEY    service-role key (falls back to SERVICE_ROLE_KEY)
  PREVIEW_DEMO_EMAIL           default: reviewer@preview.agpt.co
  PREVIEW_DEMO_PASSWORD        default: preview-pass-change-me
  PREVIEW_DEMO_CREDITS         default: 10000
"""

import asyncio
import json
import logging
import os
from pathlib import Path

import httpx

from backend.data.credit import get_user_credit_model
from backend.data.db import connect, disconnect
from backend.data.graph import Graph, create_graph
from backend.data.user import get_or_create_user

logger = logging.getLogger(__name__)

DEMO_EMAIL = os.environ.get("PREVIEW_DEMO_EMAIL", "reviewer@preview.agpt.co")
DEMO_PASSWORD = os.environ.get("PREVIEW_DEMO_PASSWORD", "preview-pass-change-me")
DEMO_CREDITS = int(os.environ.get("PREVIEW_DEMO_CREDITS", "10000"))
DEMO_GRAPH_PATH = Path(__file__).parent.parent / "graph_templates" / "preview_demo.json"


async def seed() -> None:
    supabase_url = os.environ.get("SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
        "SERVICE_ROLE_KEY"
    )
    if not supabase_url or not service_role_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY) must be set"
        )

    user_id = await _ensure_auth_user(supabase_url, service_role_key)

    await connect()
    try:
        await get_or_create_user({"sub": user_id, "email": DEMO_EMAIL})
        await _grant_demo_credits(user_id)
        await _seed_demo_graph(user_id)
    finally:
        await disconnect()

    logger.info(f"Preview seed complete for {DEMO_EMAIL} (id={user_id})")


async def _ensure_auth_user(supabase_url: str, service_role_key: str) -> str:
    """Create (or look up) a confirmed GoTrue user and return its id."""
    headers = {
        "Authorization": f"Bearer {service_role_key}",
        "apikey": service_role_key,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(base_url=supabase_url.rstrip("/"), timeout=30) as client:
        created = await client.post(
            "/auth/v1/admin/users",
            headers=headers,
            json={
                "email": DEMO_EMAIL,
                "password": DEMO_PASSWORD,
                "email_confirm": True,
            },
        )
        if created.status_code < 300:
            return created.json()["id"]

        # Already exists (or similar) — look the user up by email instead.
        existing = await client.get(
            "/auth/v1/admin/users",
            headers=headers,
            params={"email": DEMO_EMAIL},
        )
        existing.raise_for_status()
        users = existing.json().get("users", [])
        if not users:
            raise RuntimeError(
                f"Could not create or find demo user (create status "
                f"{created.status_code}: {created.text})"
            )
        return users[0]["id"]


async def _grant_demo_credits(user_id: str) -> None:
    credit_model = await get_user_credit_model(user_id)
    await credit_model.top_up_credits(user_id=user_id, amount=DEMO_CREDITS)


async def _seed_demo_graph(user_id: str) -> None:
    if not DEMO_GRAPH_PATH.exists():
        logger.info(f"No demo graph template at {DEMO_GRAPH_PATH.name} — skipping")
        return
    try:
        graph = Graph.model_validate(json.loads(DEMO_GRAPH_PATH.read_text()))
        graph.reassign_ids(user_id=user_id, reassign_graph_id=True)
        await create_graph(graph, user_id=user_id)
        logger.info(f"Seeded demo graph '{graph.name}'")
    except Exception as e:
        logger.warning(f"Demo graph seed skipped (non-fatal): {e}")


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed())


if __name__ == "__main__":
    main()
