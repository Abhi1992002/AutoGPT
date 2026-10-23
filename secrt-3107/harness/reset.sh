#!/bin/bash
# Puts the seeded workflow back to version 1 (visiting /build saves a new version).
docker exec -i autogpt_platform-db-1 psql -q -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
begin;
update platform."LibraryAgent" set "agentGraphVersion"=1 where "agentGraphId"='603e857b-20c4-46a0-8c99-8c850e2b021f';
delete from platform."AgentGraph" where id='603e857b-20c4-46a0-8c99-8c850e2b021f' and version>1;
update platform."AgentGraph" set "isActive"=true where id='603e857b-20c4-46a0-8c99-8c850e2b021f' and version=1;
commit;
SQL
docker exec autogpt_platform-redis-0-1 redis-cli -c FLUSHALL >/dev/null 2>&1 || true
