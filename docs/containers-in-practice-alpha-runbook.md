# Containers in Practice: alpha-test runbook

Prepared 12 October 2026 (Pacific). This is a test plan, not a completed alpha-test report.

Course: https://containers-in-practice-studio.jobechoi.chatgpt.site/ (published clone-workflow update)

Learner repository: https://github.com/jcpopdigitalpartners/fussy-stork

Repository snapshot inspected: 5650429f532b7ce8f8b9532c0276516ce7564869

Coverage: the opening plus all 44 investigations in Modules 0–4. Test the published course and hosted starter together, rather than treating a green unit-test run as course completion.

## 1. Freeze the starting point and separate test runs

Use a fresh Linux environment or a clean learner account with no previous course work. On Windows, run the labs inside the Ubuntu WSL environment prepared by the course; on macOS, use its Lima guest. Keep one complete run on your primary OS. Later, repeat the preparation and first running-workload path on Ubuntu/WSL, RHEL/Fedora, macOS and Windows, recording both host and guest information. Do not count an OS path as tested because another path passed.

Open the course in a fresh browser profile and follow the opening's resource checks before installing tools. Browser preferences/progress are saved on the device; a new Git clone does not clear them. Use a separate browser profile for a fresh learner run rather than resetting progress you want to keep.

After the Linux environment and Git are ready, clone into the directory name currently used by the course commands:

```bash
git clone https://github.com/jcpopdigitalpartners/fussy-stork.git ~/containers-practice-starter
cd ~/containers-practice-starter
git rev-parse HEAD
git switch -c alpha/2026-10-12
mkdir -p evidence/alpha
```

Record the actual SHA, browser/version, host OS, Linux guest/distribution, allocated CPU/RAM/storage, tool versions, and test date in `evidence/alpha/environment.md`. Configure your local Git identity using `docs/workflow.md` before the first commit. Keep the baseline, solution configuration and reports together on the alpha branch. No push to the instructor's main branch is required.

### Handoff status before the alpha run

- The published course now uses the hosted GitHub clone workflow in Module 0.2, its practice links and the Git primer. It opens `~/containers-practice-starter`, inspects the supplied history, runs the repository preflight and commits its saved report with Checkpoint 0. The obsolete ZIP handoff has been removed.
- The matching README and maintainer-guide corrections are prepared in `hosted-learner-handoff.patch`. GitHub rejected writes from the editing session, so apply and push this patch before distributing the repository. From your existing clone on main, with saved work and a clean working tree, run `git pull --ff-only`, `git am ~/Downloads/hosted-learner-handoff.patch`, then `git push origin main`. The patch was tested against the published starter commit. Record the actual new SHA after applying it.
- The clone command names its destination explicitly so the course's `~/containers-practice-starter` paths match. If you choose a different folder, use that path consistently. Preserve existing work rather than cloning over it.
- The Site currently allows only its owner. Before testing with another learner, arrange authorized course access and test the invitation/sign-in journey. GitHub repository access does not grant Site access.
- The supplied API is a starter. HPA, long-running request termination, an independent restore target and signing/trust exercises still need suitable experimental fixtures. If an activity cannot be completed from supplied instructions and reasonable learner-authored work, mark it BLOCKED and specify what is missing. Do not invent a successful result.

## 2. Run every lesson as a learner

Complete one lesson at a time, in the published order. Start from the current baseline; do not use a finished instructor solution. For each lesson:

1. Listen and inspect Understand. Write what the activity is asking you to change, observe and explain before starting it.
2. Follow the displayed steps and linked repository brief exactly. Confirm the shell, working directory, required tool and expected starting state. Record any workaround before making it.
3. Capture a prediction and baseline. Make the requested change yourself and save the commands, relevant output, configuration diff, resource identities and timestamps.
4. Run the appropriate live check. Inspect each named result and the exit code, rather than just whether a JSON file exists. Compare the evidence against the lesson's full target and `docs/evidence-rubric.md`.
5. Exercise a negative case where the activity asks for one. Diagnose the reason for the failure. Repair it and rerun using the same artifact/record identity where the claim requires continuity.
6. Write what is supported and what remains unproven. Mark the lesson complete only after its required evidence exists. Commit a small checkpoint and verify you can find the evidence again.

Use `evidence/TEMPLATE.md` for the learner evidence. Keep alpha defects in a separate `evidence/alpha/issues.md` so curriculum problems are distinguishable from intended lab failures. If you get stuck, record the missing step before using your instructor knowledge to proceed; a workaround does not turn a blocked learner path into a pass.

### Common interface check at every lesson

- [ ] Lesson title, narration, diagram and Resources refer to the same topic.
- [ ] Play/pause and waveform seeking work; the requested position does not reset to the recording's start.
- [ ] Next/Previous and lesson selection work while paused and playing; follow-audio behavior matches its selected preference.
- [ ] Diagram animation/reset, all three step overviews and the readable alternative agree with the lesson's claim.
- [ ] Practice is reachable, command copying preserves the exact command, and the shell/working directory is clear.
- [ ] Resources link to relevant material; opening/closing the drawer does not interrupt narration.
- [ ] Completion and notes persist across reloads; marking completion does not falsely imply a live solution check passed.

## 3. Run the checks at the right milestones

Run all examples below from the repository root inside Linux Bash. They assume the course's names; substitute the names you actually created. A command cannot verify a resource that does not exist yet.

### Module 0: installed versus working

```bash
set -o pipefail
bash scripts/preflight.sh --runtime 2>&1 | tee evidence/module-0/preflight.txt
```

Run only after the six preparation tools are installed. Node.js is not required for this check. Record the exit status and the guest allocation separately. Confirm that a missing or failed tool produces FAIL, not a misleading green result. Do not remove a host installation to simulate that condition; use a disposable test environment when needed.

### Module 1: supplied workload, then your container

Install Node.js 24 as instructed inside the Linux environment. Then:

```bash
npm run setup
npm test
npm run check
```

These validate the supplied code, checker tests and repository structure. API unit tests use a datastore test double. They do not prove a live database or container works.

Follow `docs/baseline-run.md` to start PostgreSQL, wait for readiness, initialize the schema and run the supplied API in Terminal A. Use Terminal B for requests and evidence:

```bash
npm run vet -- api --url http://127.0.0.1:3000 \
  --output evidence/module-1/baseline-api.json
```

Before database wiring is expected to work, use the narrower `process` or `image` check. After authoring your image and starting the API container, inspect that running image:

```bash
npm run vet -- image \
  --container course-api --image localhost/course-api:v1 \
  --url http://127.0.0.1:3000 \
  --output evidence/module-1/image.json
```

The course may use `course-api-image` earlier; pass that name if that is the running container. Once API/database networking is complete, capture a new API baseline from that environment. Label host-process and container reports clearly. An image check proves neither database wiring nor remote registry trust.

### Module 2: ready endpoints, measurements and actual scaling

After creating the Kubernetes environment, rerun preflight with `--kubernetes`. Once your Deployment, Service and client path exist:

```bash
npm run vet -- cluster \
  --context kind-containers-lab --namespace practice \
  --deployment course-api --service course-api --min-ready 2 \
  --url http://127.0.0.1:3000 \
  --output evidence/module-2/cluster.json

npm run load -- --url http://127.0.0.1:3000/records \
  --requests 200 --concurrency 4 \
  --output evidence/module-2/before.json
```

Preserve the context, namespace and access path. Repeat the same bounded load profile after one change into `after.json`. Demonstrate shared records across instances separately. A Service port-forward can select one Pod; do not call its samples evidence of distribution across replicas. A configured HPA or green cluster report does not prove scale-out: capture CPU requests, metrics, target, load conditions, timestamps, ready-replica changes and scale-in. If the workload bottlenecks in the database before CPU rises, document that result; it is not proof the HPA is broken.

### Module 3: fault, recovery and the original record

Create a successful API baseline against the exact environment about to undergo your fault. Record the original resource IDs and prediction. Perform the specified fault and recovery, then reuse that report:

```bash
npm run vet -- api --url http://127.0.0.1:3000 \
  --baseline evidence/module-1/baseline-api.json \
  --output evidence/module-3/after.json
```

Replace the baseline path when your pre-fault report belongs to a later deployment. The important relationship is before/after the same experiment, not a fixed filename. This mode reads the saved marker without creating a new one. Never replace a lost marker with a fresh record to manufacture a pass. For backup claims, restore to a separate disposable target, check the original marker there and record the source/target, backup and restore details. Persistent volume survival alone is insufficient.

### Module 4: selected runtime boundaries and broader artifact evidence

After hardening your Podman API instance:

```bash
npm run vet -- security \
  --container course-api --image localhost/course-api:hardened \
  --url http://127.0.0.1:3000 \
  --output evidence/module-4/runtime.json
```

This profile checks a Podman container's intended API behavior, image identity, PID 1 UID/capabilities/seccomp, read-only root setting and a denied root write. It is not a Kubernetes admission check or a complete security assessment. Scan, SBOM, admission and signature exercises need direct evidence tied to the tested digest, including accepted/intended and denied/mismatched controls. The starter is expected to fail some runtime checks until you implement the boundaries.

### Result interpretation

- PASS: the selected observation passed; assess all other lesson claims separately.
- FAIL: a tested condition was not met.
- BLOCKED: a dependency prevented testing; it is not a pass.
- Vet exit 0: all selected checks passed. Exit 1: observed failure or blocked work. Exit 2: invalid invocation or unreadable input.

## 4. Interface regression pass

After the full learner journey, repeat these representative cases on desktop and a narrow/mobile viewport. Distinguish an actual mobile-device test from browser resizing.

- [ ] Open Lessons and Resources individually. Close via their controls, Escape and outside dismissal. Check focus returns to the trigger and closed drawer controls cannot receive keyboard focus.
- [ ] Use the header panel toggle to expand/collapse both; check partial-open state, small-screen stacking, and continuing audio.
- [ ] Navigate by keyboard through header, tabs, waveform, drawers and dialogs without a trap or a hidden focused control.
- [ ] Toggle Larger Text before and during a diagram. Check nodes, arrows, arrow backgrounds, captions, controls and readable text; inspect long labels for clipping. Change lessons and themes, then reload to verify persistence.
- [ ] Toggle reduced motion. Check that narration and static diagrams still convey the lesson without relying on animation.
- [ ] Check the glossary is alphabetized and its pronunciation guides are readable.
- [ ] Verify terminal-styled commands copy as executable text without decorative prompts or window labels.
- [ ] Open every required resource link and confirm it still supports the named activity.
- [ ] Pause, seek forward/back, switch lessons, alter speed and reload. Check the current lesson, recording and position are consistent with the intended behavior, and no unsolicited autoplay occurs.
- [ ] Confirm no content or essential controls are hidden under the audio dock, and large text/mobile layouts remain usable.
- [ ] Test the invited learner's course access separately from the owner's signed-in session.

## 5. Log failures and decide whether to release

Copy this block for each issue:

```text
Issue ID / severity:
Lesson and course version:
Repository commit / configuration commit:
Environment, browser and tool versions:
Starting state:
Exact reproduction steps:
Expected behavior:
Actual behavior and relevant output:
Learner workaround required:
Evidence path / screenshot / recording time:
Suspected cause (label as a hypothesis):
Fix commit / published version:
Retest result and date:
```

Severities: P0 = cannot access/start/continue, destructive unexpected behavior, or checker falsely accepts an unsupported result; P1 = activity needs an undocumented workaround, narration/visual/command contradicts the task, or evidence cannot be produced; P2 = cosmetic or wording friction that does not prevent the activity. An intentionally induced lab failure is not a defect when its cause is understandable and the learner can complete the required recovery.

Release only after the full primary-environment path has evidence, P0/P1 issues are fixed and retested, both positive and negative controls behave as expected, and at least one cold tester completes the start-to-first-working-API journey using the materials without coaching. Record the remaining OS/device coverage and unresolved lower-priority issues explicitly. Keep advanced activities BLOCKED until their necessary fixtures/instructions are usable.

Use a second fresh clone for the final rerun. Prefer fixes between recorded runs, rather than silently changing instructions while recording a pass. Stop only the named lab processes/resources you created; retain evidence before removing data and avoid global cleanup commands.

## 6. Complete activity ledger

For each entry, record **NOT RUN / PASS / FAIL / BLOCKED**, elapsed learner time, evidence location and related issue IDs. Passing requires the activity's whole evidence target, not just its vet profile. The common interface checks in section 2 apply to every entry.

### Opening · Opening

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#opening)

- [ ] Choose your environment: Ubuntu/WSL, RHEL/Fedora, macOS, or Windows.
- [ ] Open the preparation guide and identify the Linux environment you will use.
- [ ] Continue to Module 0 to check the machine and prepare the toolchain.

**Required evidence:** Identify your operating-system path and one workstation property to verify in Module 0.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 00.0 · A testable baseline

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#baseline)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-0/0.0-baseline.md)

- [ ] Use the workstation sizing table and resource check in Opening, Module −0.1. Record logical CPU count, RAM, free storage and virtualization support; compare host and Linux guest allocations if applicable.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** You can run the tools, execute a container, and return to a known checkpoint.

**Check:** Run `bash scripts/preflight.sh --runtime`. Node.js is not needed for this preparation check.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 00.1 · Prepare your toolchain

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#toolchain)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-0/0.1-toolchain.md)

- [ ] Choose your operating system in the installation guide. Install and verify the six tools. Leave Kubernetes for Module 2.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Choose your operating system, install the tools, and verify each command.

**Check:** Run `bash scripts/preflight.sh --runtime`. Node.js is not needed for this preparation check.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 00.2 · Verify your environment

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#preflight)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-0/0.2-preflight.md)

- [ ] Run the six version checks and the Podman hello image. Explain which result proves that a container actually executes.
- [ ] Clone this repository inside your Linux environment. Inspect its starter commit and choose a task branch.
- [ ] Confirm README.md, api/ and evidence/ are present. Save the runtime result for Checkpoint 0.

**Required evidence:** The hello container succeeds, your cloned learner workspace is available inside Linux, and its starter commit is visible.

**Check:** Run `bash scripts/preflight.sh --runtime`. Node.js is not needed for this preparation check.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 00.3 · Recover deliberately

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#recovery)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-0/0.3-recovery.md)

- [ ] Write the first failing command, exact error, and last known-good output before attempting a repair.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** You can explain what broke and identify the last known-good state.

**Check:** Run `bash scripts/preflight.sh --runtime`. Node.js is not needed for this preparation check.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 00.4 · Choose your depth

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#learning-modes)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-0/0.4-learning-modes.md)

- [ ] Choose Core for the proof, Deep Dive for understanding a mechanism, or Challenge for independent implementation.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Use observable checkpoints to decide when a lesson is complete.

**Check:** Run `bash scripts/preflight.sh --runtime`. Node.js is not needed for this preparation check.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 00.5 · Checkpoint 0 & next steps

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#checkpoint)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-0/0.5-checkpoint.md)

- [ ] Record the six tool versions, guest resource checks and successful hello-container result in evidence/baseline.md.
- [ ] Review and commit that evidence, then create a local checkpoint-0 tag on your own work.
- [ ] Inspect the checkpoint and distinguish what belongs inside an application image from what stays outside it.

**Required evidence:** Record your result, establish Checkpoint 0 in source control, and begin the reproducibility exercise from a verified environment.

**Check:** Run `bash scripts/preflight.sh --runtime`. Node.js is not needed for this preparation check.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.1.0 · The reproducibility problem

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m1-opening)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.1.0-m1-opening.md)

- [ ] Identify three assumptions outside the source code: ports, database location, or environment configuration.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Another developer should be able to inspect the repo and reproduce the runtime.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.1.1 · Inspect the workload

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#inspect)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.1.1-inspect.md)

- [ ] Use docs/baseline-run.md to start the supplied API and its baseline PostgreSQL database. Inspect the source and runtime settings.
- [ ] Compare /health, /ready and /records. Create and retrieve a real record; explain which dependencies each request exercises.
- [ ] Run the api vet check. Review its report, record what remains unproven, and commit your evidence on a task branch.

**Required evidence:** The API responds before it is packaged, and its dependencies are documented.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.1.2 · Build an OCI image

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#image)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.1.2-image.md)

- [ ] Write api/Containerfile and api/.containerignore; explain the role of each instruction.
- [ ] Build and inspect your OCI image, then run it and compare the health and readiness responses.
- [ ] Run the image vet check using the running container and the expected image reference. Commit the recipe and evidence.

**Required evidence:** A call to /health succeeds through the published container port.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.0 · Externalize configuration

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#config)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.0-config.md)

- [ ] Change an environment variable at start-up without changing the image digest.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** The image identifier remains unchanged when runtime configuration changes.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.1 · Connect the services

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#network)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.1-network.md)

- [ ] Connect the API and database as separate services and derive the API’s database address from the actual network.
- [ ] Use the api vet check to verify readiness and a real record round trip. Inspect the service/network membership independently.
- [ ] Save the run settings, network inspection and vet report. Commit the configuration and your explanation.

**Required evidence:** Create a record through the API, then retrieve it from PostgreSQL.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.2 · Preserve application data

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#storage)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.2-storage.md)

- [ ] Create a record, replace the API container, and look for the same record. Compare data storage with compute lifecycle.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Records survive database-container replacement when the same persistent volume is reused.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.3 · Improve the image

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#harden)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.3-harden.md)

- [ ] Inspect installed packages, build layers, and the user identity used by the runtime.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** The API still passes its health test after the image is rebuilt.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.4 · Describe the environment

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#iac)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.4-iac.md)

- [ ] Compare the intended resources in the OpenTofu plan with what exists after applying it.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Review a plan, apply the lab configuration, and inspect the resulting outputs.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.5 · Destroy and reconstruct

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#rebuild)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.5-rebuild.md)

- [ ] Remove disposable containers and recreate them from the declared configuration, then re-test the API.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** The environment can be rebuilt and the API tested without undocumented manual steps.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.6 · The staging challenge

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#challenge)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.6-challenge.md)

- [ ] Deploy the same image in two named configurations; compare image identity and environment values.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Both environments respond, and the image identity is unchanged.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 1.2.7 · Checkpoint 1

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#conclusion)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-1/1.2.7-conclusion.md)

- [ ] Summarize image identity, configuration location, database persistence, and reconstruction commands.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Image, configuration, network, state, and recovery have clear boundaries.

**Check:** Use `process`, `image`, or `api` vet checks at the appropriate stage. See [solution checks](../../docs/vetting.md).

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.0 · When one container isn’t enough

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-opening)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.0-m2-opening.md)

- [ ] Follow the path of one request. Predict what breaks when demand exceeds the capacity of one API instance.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Describe the client, Service, replicas, and shared dependency without confusing their responsibilities.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.1 · Establish a performance baseline

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-baseline)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.1-m2-baseline.md)

- [ ] Pick throughput, latency, and error rate. State the load conditions so you can repeat them after the architecture changes.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Retain baseline results so later changes can be compared fairly.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.2 · Introduce replicas and Kubernetes

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-replicas)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.2-m2-replicas.md)

- [ ] Trace Clients → Service → eligible API Pods. Inspect which ready endpoints the Service can reach.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Inspect Deployment replicas, ready Pods, Service selectors, and eligible EndpointSlices.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.3 · The problem with local state

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-shared-state)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.3-m2-shared-state.md)

- [ ] Watch the animation. The first request writes a preference through Pod 1; a later connection reaches Pod 3 and reads the same value.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** A state value written by Pod 1 can be read by Pod 3; a stateless request need not touch Valkey.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.4 · Give the scheduler useful information

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-resources)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.4-m2-resources.md)

- [ ] Compare a CPU request with a CPU limit and predict how throttling differs from an out-of-memory termination.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Inspect actual workload behavior under declared resource constraints.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.5 · Measure changes under load

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-load)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.5-m2-load.md)

- [ ] Repeat the same load profile through the Kubernetes Service and compare p95 latency, successful throughput, and errors.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Produce comparable before-and-after observations.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.6 · Horizontal Pod Autoscaling

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-hpa)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.6-m2-hpa.md)

- [ ] Observe actual CPU use relative to requests, the HPA target, and the time until a new Pod becomes ready.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Observe CPU metrics and ready replica changes under sustained load.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.7 · Why more replicas may not help

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-bottleneck)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.7-m2-bottleneck.md)

- [ ] Increase load while examining API latency, datastore operations, and database connection pressure.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Find one downstream bottleneck and propose a measurement to test it.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 02.8 · Challenge and Checkpoint 2

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m2-checkpoint)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-2/2.8-m2-checkpoint.md)

- [ ] Present a baseline, a change in replica count, a repeat test, shared-state evidence, and a known limit.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Retain manifests, load-test configuration, measurements, and a concise architectural explanation.

**Check:** Use the `cluster` vet check and the load harness. Scaling behavior and HPA convergence require your own timed observations.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.0 · When a working system fails

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-0)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.0-m3-0.md)

- [ ] Sketch three failure consequences: an interrupted request, a replacement Pod, and an unavailable datastore.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** The Pod controller may restore the desired replica count, but application success and data safety require separate evidence.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.1 · What survives a replacement?

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-1)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.1-m3-1.md)

- [ ] Before removing anything, identify which values come from the image, environment, process memory, and persistent storage.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Replacement restores code and configuration, but not arbitrary writes in a disposable container layer.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.2 · Give data a lifecycle of its own

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-2)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.2-m3-2.md)

- [ ] Trace the relationship: database container → mounted volume → claim → volume → underlying storage.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** A claim may be rebound to a replacement workload, but local storage remains vulnerable to loss of its backing node.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.3 · Persistence is not a backup

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-3)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.3-m3-3.md)

- [ ] Design a disposable target database and a known record-count check. Predict what a backup cannot undo about a subsequent bad write.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Restored data is independently queryable and meets an explicitly stated expected result.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.4 · Healthy, ready and alive

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-4)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.4-m3-4.md)

- [ ] Predict behavior for three conditions: slow startup, temporary database failure, and unrecoverable deadlock.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** Probe outcomes lead to different actions. Readiness failure and liveness failure are not interchangeable.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.5 · Give requests time to finish

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-5)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.5-m3-5.md)

- [ ] Compare a short request, a long-running request, and an abrupt kill. Predict which ones can finish in the grace period.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** SIGTERM handling, grace period, and endpoint removal coordinate imperfectly; existing connections may still need to finish.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.6 · Deploy without creating an incident

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-6)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.6-m3-6.md)

- [ ] Predict the rollout when new Pods stay unready. Observe the relationship between desired replicas, available replicas, and revision history.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** New Pods gain eligibility only after readiness succeeds; rollback requires behavioral verification.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.7 · Break it deliberately

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-7)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.7-m3-7.md)

- [ ] Choose a fault and a prediction, then list evidence from the client, controller, and datastore points of view.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** A causal explanation: which condition changed, how it was detected, and how recovery was independently verified.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 3.8 · Checkpoint 3: Prove recovery

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m3-8)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-3/3.8-m3-8.md)

- [ ] Assemble five artifacts: failure hypothesis, baseline, observation, recovery action, and independent functional verification.
- [ ] Test one claim in your local environment. Capture the command, result, and any failure.
- [ ] Compare the observation with the evidence target. Explain what remains unproven.

**Required evidence:** An evidence-backed claim that identifies exactly which failure modes the lab did—and did not—test.

**Check:** Capture an `api` vet report before a fault, then rerun with `--baseline` after recovery. Complete the recovery evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.0 · Working ≠ safe

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-0)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.0-m4-0.md)

- [ ] Record the health response and identify exactly what that probe exercises.
- [ ] Inspect the effective process identity, groups, and writable mounts or paths.
- [ ] Capture the image reference and observed configuration in a baseline note.

**Required evidence:** A baseline note that ties the health response, runtime identity, and writable surfaces to a named workload and image.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.1 · Run without root

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-1)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.1-m4-1.md)

- [ ] Inspect the effective UID and group before you make a change.
- [ ] Adapt the image or runtime configuration to use a non-root process; retest identity.
- [ ] Attempt an explicitly protected write and repeat the API health check.

**Required evidence:** Before/after identity evidence, the rejected protected write, and a succeeding application request.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.2 · Make the root filesystem read-only

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-2)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.2-m4-2.md)

- [ ] Inspect where the API writes temporary files and any persistent state.
- [ ] Configure the root filesystem boundary and provide only the required writable surfaces.
- [ ] Demonstrate a denied write on the image filesystem and successful intended writes, then retest the API.

**Required evidence:** A mount or filesystem description, one expected read-only denial, one allowed bounded write, and a passing API check.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.3 · Capabilities + seccomp

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-3)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.3-m4-3.md)

- [ ] Inspect the workload’s capabilities and effective syscall profile.
- [ ] Apply narrower capability and syscall restrictions suited to the workload.
- [ ] Exercise a chosen disallowed privileged operation, then exercise the normal API path.

**Required evidence:** Recorded capability/seccomp configuration plus one policy-relevant denial and one successful application request.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.4 · Scan, then decide

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-4)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.4-m4-4.md)

- [ ] Identify the exact image digest and produce a vulnerability scan for it.
- [ ] Select a finding and investigate severity, affected package, fix availability, and exposure.
- [ ] Document the proposed action; if the artifact changes, rescan and recheck application behavior.

**Required evidence:** Digest, scan output or structured report, triage rationale, and revalidation evidence when a change was made.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.5 · An SBOM makes dependencies visible

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-5)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.5-m4-5.md)

- [ ] Identify the image that was scanned and choose a machine-readable SBOM format.
- [ ] Generate an SBOM and find a component you did not explicitly declare.
- [ ] Trace its likely origin and associate the inventory with the matching image digest.

**Required evidence:** SPDX or CycloneDX SBOM plus a short explanation of one discovered direct, transitive, or base-image component.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.6 · Policy that can say no

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-6)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.6-m4-6.md)

- [ ] Prepare an isolated namespace in the local kind cluster and inspect its Pod Security Admission mode.
- [ ] Submit a deliberately noncompliant Pod specification and capture the admission response.
- [ ] Submit a compliant workload, confirm admission, and check that it becomes operational.

**Required evidence:** Namespace policy configuration, rejected Pod-creation response, and admitted healthy workload evidence.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.7 · Name, verify, then run

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-7)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.7-m4-7.md)

- [ ] Resolve the release image to a digest and compare it with the artifact you reviewed.
- [ ] State the trust policy: the artifact digest, verification method, and identity or public key you expect. Verify the signed artifact against that policy.
- [ ] Record the signer or key check, artifact identity, and decision to accept or reject deployment.

**Required evidence:** Pinned image digest, verification output or documented expected failure, and an explicit trusted identity/key criterion.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

### 4.8 · Secure and still useful

[Open the lesson](https://containers-in-practice-studio.jobechoi.chatgpt.site/#m4-8)

[Repository brief](https://github.com/jcpopdigitalpartners/fussy-stork/blob/5650429f532b7ce8f8b9532c0276516ce7564869/labs/module-4/4.8-m4-8.md)

- [ ] Create a test matrix of intended operations and operations that must be denied.
- [ ] Run both sets against the same deployed digest and capture the actual outcomes.
- [ ] Submit a concise pull-request summary linking configuration, scan, SBOM, verification, and test evidence.

**Required evidence:** Reviewable PR summary: tested digest, positive and negative outcomes, artifacts, residual risks, and links to raw evidence.

**Check:** Use the `security` vet check for a running Podman container. Admission, scan, SBOM and trust claims need the separate artifact/evidence rubric.

- [ ] Common interface checks completed
- [ ] Evidence saved and retrievable

Result: NOT RUN · Elapsed time: ___ · Evidence: ___ · Issues: ___

