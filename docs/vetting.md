# Vet your solution

Run checks against your actual lab. A result is **PASS**, **FAIL**, or **BLOCKED**. A blocked dependent check is not a pass. The process exits with `0` only when every selected check passes; `1` means observed failure/blocked work; `2` means an invalid invocation or unreadable input file.

The check reports describe requirements, not completed configuration. Use the failure to decide what to inspect; keep your own implementation.

| Mode | Observations | What it does not establish |
| --- | --- | --- |
| `process` | HTTP health responds with the API contract | Database access, persistence or security |
| `api` | Readiness, stored record round trip, malformed/empty input rejection and unknown-route rejection | A fault occurred, a backup is restorable, or all API behavior is correct |
| `image` | Running container image ID matches the expected local image; HTTP health works | Registry signature, remote digest trust or database wiring |
| `cluster` | API checks plus ready Deployment replicas and selector-matched ready Service endpoints | Traffic distribution, HPA behavior or scheduler decisions under pressure |
| `security` | API checks, expected running image, PID 1 UID/capabilities/seccomp state, read-only root setting and a denied root-file write | Complete syscall policy coverage, vulnerability disposition, admission or artifact trust |

## Preparation · Module 0

This Bash check does not require Node.js:

```bash
bash scripts/preflight.sh --runtime
```

If you want a text report, preserve the failure exit code while using `tee`:

```bash
set -o pipefail
bash scripts/preflight.sh --runtime 2>&1 | tee evidence/module-0/preflight.txt
```

A version string proves an executable responds. The hello-container check provides runtime evidence. Compare guest resources separately using the course’s workstation check. In Module 2, `--kubernetes` also checks kind and kubectl client availability.

## Packaging · Module 1.1.2

Before database networking is configured, use the narrower process or image check. The examples use the course’s local image name and a container called `course-api`; pass your actual names.

```bash
npm run vet -- image \
  --container course-api --image localhost/course-api:v1 \
  --url http://127.0.0.1:3000 \
  --output evidence/module-1/image.json
```

The image check resolves local image identity through Podman. Keep a separate Skopeo/registry digest observation where the lesson asks for it. You must supply the API URL that reaches the inspected container.

## Connected API · Module 1.2.1

```bash
npm run vet -- api --url http://127.0.0.1:3000 \
  --output evidence/module-1/api.json
```

This mode creates one uniquely named marker and leaves it in the disposable database. It never deletes existing records. Failed readiness blocks the record operation; a healthy HTTP process alone cannot pass this profile.

## Kubernetes · Module 2

The example uses context `kind-containers-lab`, namespace `practice`, and a Deployment and Service called `course-api`. Supply your own actual names. The checker includes the context on every kubectl request and does not mutate cluster resources.

```bash
npm run vet -- cluster \
  --context kind-containers-lab --namespace practice \
  --deployment course-api --service course-api --min-ready 2 \
  --url http://127.0.0.1:3000 \
  --output evidence/module-2/cluster.json
```

Ready replicas alone are insufficient: the Service must have enough ready endpoints matching the Deployment-selected Pods. You still need to show that the client entry point reaches the intended Service. A Service port-forward can select one Pod; it cannot demonstrate request distribution across replicas.

For a repeatable closed-loop load sample:

```bash
npm run load -- --url http://127.0.0.1:3000/records \
  --requests 200 --concurrency 4 \
  --output evidence/module-2/before.json
```

Repeat the same profile after a controlled change and use a different output filename. The harness reports successful throughput, p50/p95/p99 latency, HTTP errors, network errors and observed instance names. Errors remain in latency samples. These measurements include the client, network and datastore; they do not isolate CPU performance or guarantee HPA activation. Use a controlled local target and record the test conditions. HTTP connection reuse is disabled for samples, but your access path can still select one backend.

## Record continuity · Module 3

First save an `api` report while the system works. Perform your chosen replacement or recovery experiment, record the fault and its timestamps, and rerun using the saved marker:

```bash
npm run vet -- api --url http://127.0.0.1:3000 \
  --baseline evidence/module-1/api.json \
  --output evidence/module-3/after.json
```

This run reads the same ID and value; it creates no new marker. A failed continuity check must not be replaced with a fresh marker just to get a pass. A surviving marker alone does not prove the workload was replaced. For backup work, run the check against an independent restore environment and add source/target, backup and recovery evidence using [the rubric](evidence-rubric.md).

## Runtime boundaries · Module 4

Use this profile against a running Podman instance of your hardened API:

```bash
npm run vet -- security \
  --container course-api --image localhost/course-api:hardened \
  --url http://127.0.0.1:3000 \
  --output evidence/module-4/runtime.json
```

The original starter is expected to fail several of these checks. This selected course profile expects a nonzero effective UID, zero effective capabilities and seccomp filter mode. The root-write probe creates a uniquely named file only if writing succeeds, then removes that same file. The report retains the actual denial reason. Read-only configuration and write denial are separate observations.

This mode evaluates Podman, not a Kubernetes security policy. For Kubernetes admission, scan/SBOM decisions and signer verification, retain the direct tool output and evaluate the matching artifact using [the evidence rubric](evidence-rubric.md). A claim that is not checked remains unproven.

## Keep the evidence

The JSON report records the selected target and each check. It does not save API environment variables, the whole database contents or complete container inspection objects. Commit relevant reports with your configuration and explanation. Rerun the check after a change; an earlier report is not evidence about a new image or deployment.
