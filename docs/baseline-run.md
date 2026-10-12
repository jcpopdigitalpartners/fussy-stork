# Run the supplied baseline

Use Linux Bash in the same environment where Podman and the repository live. This guide starts the supplied workload so you can inspect it before solving the packaging and networking investigations.

## Terminal A · repository root

Check that localhost port 5432 is free. The values below are disposable lab credentials.

```bash
podman run -d --name cip-baseline-db \
  -p 127.0.0.1:5432:5432 \
  -e POSTGRES_DB=course \
  -e POSTGRES_USER=course \
  -e POSTGRES_PASSWORD=coursepass \
  docker.io/library/postgres:17
```

Repeat the readiness check until it reports accepting connections:

```bash
podman exec cip-baseline-db pg_isready -U course -d course
```

Then initialize the table from the repository root:

```bash
podman exec -i cip-baseline-db psql -U course -d course < api/schema.sql
```

Install the API dependencies using Node.js 24, test them, and start the API:

```bash
npm run setup
npm test
DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=course \
  DB_USER=course DB_PASSWORD=coursepass PORT=3000 npm start
```

Leave Terminal A running. `.env.example` documents the settings but is not automatically loaded.

## Terminal B · repository root

```bash
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/ready
npm run vet -- api --url http://127.0.0.1:3000 \
  --output evidence/module-1/baseline-api.json
```

The vet check creates one marker and reads it through the API. Check the results rather than copying an expected response into your evidence. `npm test` uses a datastore test double; this vet command queries the live API and database.

If health succeeds but readiness fails, inspect the database readiness, schema, address and credentials. If ports or names are occupied, identify the earlier lab process/container before starting another copy.

## Record the starting point

Save your process/readiness comparison in [baseline evidence](../evidence/baseline.md), and use the [Git workflow](workflow.md) to commit it.

This database starts without a persistent volume. Removing the container removes its writable-layer data. Designing and proving persistence belongs to the later investigation.

## When finished with this disposable baseline

Stop the API with Ctrl+C in Terminal A. Inspect the database:

```bash
podman ps -a --filter name=cip-baseline-db
```

After you have recorded the results and no longer need its data, remove only this named lab container:

```bash
podman rm -f cip-baseline-db
```

Do not use global cleanup commands; keep other projects and later lab resources intact.
