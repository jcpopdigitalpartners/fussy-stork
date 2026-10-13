# Containers in Practice — learner repository

One API. One database. Five modules of increasingly demanding evidence.

Carry the same workload from local execution through packaging, scaling, recovery and runtime security. The supplied API is your starting workload. You author the Containerfile, infrastructure declarations, Kubernetes manifests and policy decisions.

## Start here

Prepare a Linux environment using the course’s **Ubuntu/WSL, RHEL/Fedora, macOS or Windows** path. macOS runs the workload inside its Lima guest; Windows runs it inside Ubuntu WSL 2. Clone and work inside that Linux environment.

Clone the [learner repository](https://github.com/jcpopdigitalpartners/fussy-stork) into the folder used by the course commands:

```bash
git clone https://github.com/jcpopdigitalpartners/fussy-stork.git ~/containers-practice-starter
cd ~/containers-practice-starter
git remote -v
git log --oneline -3
```

The clone already includes Git history. Do not run `git init` or create a second initial commit. `starter-v0.1.0` identifies the supplied starting point; your later `checkpoint-0` tag records your own verified baseline. Cloning the public starter does not require a GitHub account. Local commits need your Git identity; use [the Git workflow](docs/workflow.md).

Use the same root directory throughout the course. If it already exists, inspect it and preserve any earlier work; reuse a clone of this repository or choose a separate destination and adjust later paths consistently. The portable bundle remains an offline distribution option.

In 0.1, prepare Linux/Git and clone this workspace. In 0.2, install the remaining preparation tools and establish the baseline:

```bash
bash scripts/preflight.sh --runtime
```

Then follow [Module 0](labs/module-0/README.md). In Module 1, install Node.js 24 inside the same Linux environment, then install the locked API dependencies and run the checks:

```bash
npm run setup
npm test
npm run check
```

Start the API and PostgreSQL using [the baseline run guide](docs/baseline-run.md). Use [solution checks](docs/vetting.md) to evaluate your running work and save reports.

## Course path

| Module | Investigation | Start |
| --- | --- | --- |
| 0 · Prepare | Establish and record a known-good toolchain | [Module 0](labs/module-0/README.md) |
| 1 · Build | Package, configure, connect and reconstruct the workload | [Module 1](labs/module-1/README.md) |
| 2 · Scale | Measure demand, replicas, shared state and limits | [Module 2](labs/module-2/README.md) |
| 3 · Recover | Test storage, replacement, backup, probes and rollout | [Module 3](labs/module-3/README.md) |
| 4 · Constrain | Test identity, filesystem, authority and artifact claims | [Module 4](labs/module-4/README.md) |

The [course studio](https://containers-in-practice-studio.jobechoi.chatgpt.site/) supplies the narrated lessons. This repository includes 44 investigation briefs corresponding to Modules 0–4. Orientation and OS installation stay in the course.

## Where work belongs

- `api/`: the supplied Node.js workload, PostgreSQL schema, tests and your future Containerfile
- `labs/`: investigation briefs and evidence targets
- `work/`: your Kubernetes, OpenTofu and policy configuration
- `scripts/`: preflight, live solution checks and controlled load measurement
- `evidence/`: your observations and machine-readable reports
- `.github/workflows/`: starter CI checks

Start with [the Git workflow](docs/workflow.md). Copy [the evidence template](evidence/TEMPLATE.md) for each investigation.

## Vet a solution

For a fully connected API and database:

```bash
npm run vet -- api --url http://127.0.0.1:3000 \
  --output evidence/module-1/api.json
```

A successful run checks readiness, positive record behavior and negative input controls. It creates one retained `cip-vet` record. It reports exactly which claims remain unproven. Other modes check the process alone, the actual running image, Kubernetes Service endpoints, or selected runtime boundaries.

See [the full vet command reference](docs/vetting.md) and [the evidence rubric](docs/evidence-rubric.md). Passing unit tests or CI does not demonstrate a working container, database or cluster. Live vet reports are evidence for their named checks; they are not a complete course grade or a security certificate.

## Starter boundaries

This release provides no completed Containerfile, Kubernetes workload or infrastructure/policy solution. The later investigations require you to author those configurations and design the requested fault/restore experiments. The provided API is intentionally simple; HPA and termination investigations may require a controlled workload change. Preserve that change in your evidence rather than assuming the fixture exercises every failure mode.

For local test cleanup and data lifetime, use [the baseline run guide](docs/baseline-run.md). For publishing this starter, see [the maintainer handoff](docs/maintainer-handoff.md).
