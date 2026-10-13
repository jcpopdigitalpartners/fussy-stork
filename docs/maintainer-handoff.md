# Maintainer handoff · starter v0.1.0

This is the first learner-repository foundation. It carries the course’s supplied API and schema, 44 aligned lesson briefs, evidence structure, live verification modes, a bounded load harness, and starter CI.

## What is ready

- Student-authored configuration paths, without completed lab solutions
- Cloneable `main` history and `starter-v0.1.0` release tag in the portable Git bundle
- Locked API dependencies, Node.js 24 baseline and PostgreSQL 17 baseline instructions
- Actual API checks and read-only Podman/Kubernetes inspections
- A scope-aware evidence rubric for claims that cannot be inferred from automated checks

CI runs API/checker unit tests and repository syntax/link checks. Its API tests use a datastore test double. CI does not launch Podman, PostgreSQL or Kubernetes, and is not a substitute for a student’s live lab reports.

## Hosted repository

The hosted starter is [jcpopdigitalpartners/fussy-stork](https://github.com/jcpopdigitalpartners/fussy-stork). Its public `main` branch and `starter-v0.1.0` tag contain the learner starting point.

The course and student README use:

```bash
git clone https://github.com/jcpopdigitalpartners/fussy-stork.git ~/containers-practice-starter
cd ~/containers-practice-starter
```

The destination matches the course's terminal commands. Clone inside the prepared Linux environment; the clone includes history and needs no `git init`. Keep course handoff instructions and this README aligned when publishing future starter changes. The portable bundle is an offline option, not the primary hosted handoff.

## Next fixture work

Build advanced fixtures incrementally against the course’s evidence targets: a controlled demand profile for HPA, a bounded long-running request for termination, an independently restorable database target, and explicit artifact signing/trust material. Keep the starter branch free of finished learner configurations. A solution or instructor reference belongs in a separately controlled repository/branch, not in a disguised student exercise.

The runtime-security profile currently checks a Podman container. Kubernetes admission and signature verification remain direct-tool evidence exercises; the repository does not pretend to auto-grade those decisions.
