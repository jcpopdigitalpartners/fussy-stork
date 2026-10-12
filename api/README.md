# The supplied workload

This Node.js API uses PostgreSQL for records. The source intentionally starts with local-lab defaults and no custom shutdown handler. Observe its behavior before changing it.

| Route | Behavior |
| --- | --- |
| `GET /health` | Reports a running HTTP process and its instance name. Does not query the database. |
| `GET /ready` | Queries the database; returns 503 if that operation fails. |
| `GET /records` | Reads the shared records table. |
| `POST /records` | Stores a nonempty string in `value`; rejects invalid input. |

`instance` is taken from `HOSTNAME`, or is `local` when that variable is missing. Run settings are `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. `.env.example` documents them; the application does not load that file automatically.

The learner creates `Containerfile` and `.containerignore` here in Module 1.1.2. `schema.sql` initializes the records table. Unit tests use a datastore test double; live database proof comes from the `api` vet check.
