# syntax=docker/dockerfile:1

# AutoGPT Desktop backend: the AutoGPT backend plus PostgreSQL, Valkey and RabbitMQ in one
# container, with all state on the /data volume. Adapted from upstream's
# autogpt_platform/single-container image, minus the web frontend, nginx and FalkorDB (the
# desktop app is the UI).
#
# BASE_IMAGE is this repo's backend image (autogpt_platform/backend/Dockerfile, target
# `server`), so backend code and dependency changes ship with every build. run.sh builds both;
# by hand, from the repo root:
#
#   docker build -f autogpt_platform/backend/Dockerfile --target server \
#     -t autogpt-desktop-backend-base:$VERSION .
#   docker build -f autogpt_platform/desktop/backend-docker/Dockerfile \
#     --build-arg BASE_IMAGE=autogpt-desktop-backend-base:$VERSION --build-arg VERSION=$VERSION \
#     -t autogpt-desktop-backend:$VERSION .

ARG BASE_IMAGE=autogpt-desktop-backend-base:dev
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive

# Supervisor owns every daemon, so block the packages' service auto-start and drop the
# cluster/config the PostgreSQL package creates; ours is initialised on /data at first boot.
RUN printf '#!/bin/sh\nexit 101\n' > /usr/sbin/policy-rc.d \
    && chmod 0755 /usr/sbin/policy-rc.d \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        postgresql-17 \
        postgresql-17-pgvector \
        rabbitmq-server \
        supervisor \
        tini \
        valkey-server \
    && rm -f /usr/sbin/policy-rc.d \
    && rm -rf /var/lib/apt/lists/* /var/lib/postgresql/17/main /etc/postgresql/17/main

COPY --chmod=0755 autogpt_platform/desktop/backend-docker/entrypoint.sh \
     autogpt_platform/desktop/backend-docker/start-backend.sh \
     /opt/autogpt-desktop/
COPY autogpt_platform/desktop/backend-docker/init.sql \
     autogpt_platform/desktop/backend-docker/supervisord.conf \
     /opt/autogpt-desktop/

# Everything runs on one host, so services reach each other on 127.0.0.1 (not "localhost",
# which may resolve to IPv6 first). Secrets are generated into /data on first boot.
ENV PATH="/usr/lib/postgresql/17/bin:${PATH}" \
    APP_ENV=local \
    BEHAVE_AS=local \
    PYRO_HOST=127.0.0.1 \
    REDIS_HOST=127.0.0.1 \
    REDIS_PORT=6379 \
    RABBITMQ_HOST=127.0.0.1 \
    RABBITMQ_PORT=5672 \
    RABBITMQ_DEFAULT_USER=guest \
    RABBITMQ_DEFAULT_PASS=guest \
    PLATFORM_BASE_URL=http://localhost:8006 \
    WORKSPACE_STORAGE_DIR=/data/workspace \
    CLAMAV_SERVICE_ENABLED=false \
    PYTHONUNBUFFERED=1

ARG VERSION=dev
ENV AGPT_BACKEND_VERSION=${VERSION}
LABEL org.opencontainers.image.title="autogpt-desktop-backend" \
      org.opencontainers.image.description="AutoGPT backend for AutoGPT Desktop, single container" \
      org.opencontainers.image.source="https://github.com/Abhi1992002/autogpt-desktop-v2" \
      org.opencontainers.image.version="${VERSION}"

WORKDIR /app/autogpt_platform/backend
VOLUME ["/data"]
# 8006: REST API (+ GET /health, /health/status) · 8001: WebSocket API
EXPOSE 8006 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10m --retries=3 \
    CMD curl -fsS http://127.0.0.1:8006/health/status > /dev/null || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "/opt/autogpt-desktop/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/opt/autogpt-desktop/supervisord.conf"]
