# What would convince a reviewer?

Use the named automated checks for fast feedback. For the rest of the lesson, score each criterion as **supported**, **not yet supported**, or **not applicable with a reason**. Link actual commands, outputs and relevant configuration. A claim without an observation stays unsupported.

| Module | Supported when your evidence shows… | Common false positive to rule out |
| --- | --- | --- |
| 0 · Prepare | Actual Linux guest allocation, six tool versions, successful runtime execution and a retrievable Git checkpoint | Host RAM instead of guest RAM; executable versions without a runtime test |
| 1 · Build | Running image identity, one image with runtime configuration, separate API/database wiring, data lifetime and a reconstructable environment | Health response without database work; a mutable tag without observed identity |
| 2 · Scale | Repeatable before/after load conditions, ready Service endpoints, shared records across instances and a bounded bottleneck explanation | Replica count alone; port-forward samples mistaken for load-balancing proof |
| 3 · Recover | Fault prediction, the fault actually occurred, data/service observations, recovery action and independent verification | Persistent volume assumed to be a backup; a newly created record mistaken for restored data |
| 4 · Constrain | Same artifact identity across runtime, scan, SBOM and trust evidence; intended operations succeed while chosen forbidden operations fail for understood reasons | Admission accepted mistaken for runtime safety; a scan or SBOM mistaken for complete security |

## Positive and negative controls

Record an intended operation and an operation that should fail. Explain the observed cause of failure. A request timing out does not establish that a policy rejected it. An operation that already failed before your change does not demonstrate that your change caused the denial.

## Performance and HPA

Keep the request path, request count/concurrency, API operation, replica state, CPU requests, metrics source and timestamps. Preserve scale-out and scale-in observations; a configured HPA is not proof that it acted. The supplied API does datastore work and may bottleneck there before CPU utilization rises. If you add bounded CPU work or a delayed request for an experiment, include that source change and explain its effect on the comparison.

## Persistence and restore

Identify where data lived before and after replacement. Capture the original marker, resource identities and events. For a backup claim, restore to a separate disposable target and inspect meaningful data there. State what data was expected to survive and the recovery-point/time assumptions. The continuity check verifies the marker, not the whole backup procedure.

## Admission and artifact trust

Keep a rejected noncompliant submission and an accepted compliant one in the same explicitly named test context. Test that the accepted workload becomes operational. For signing, state the expected digest and trusted identity/public key before verification; preserve a successful verification and a deliberately mismatched identity/artifact result. A verifier exiting successfully without checking your intended policy is insufficient.

## Submission

Use [the evidence template](../evidence/TEMPLATE.md). Link your configuration commit, named vet reports, remaining checks and a bounded conclusion in the pull-request template. Do not substitute copied expected output for local results.
