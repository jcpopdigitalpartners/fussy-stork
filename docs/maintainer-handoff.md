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

Recommended name: `containers-in-practice-labs`.

Create an empty GitHub repository in the intended account or organization, then supply that repository URL for source publication. This session’s GitHub tools cannot create the repository, so no public clone URL has been fabricated.

Once the destination exists, the starter source can be published using the included history. Choose the code/content licensing and the repository audience before distributing a public edition. Add the real clone URL to the student README and update the course’s ZIP-based workspace handoff to the clone workflow. Those course-site changes are a separate publication; this package does not rewrite the live course.

## Next fixture work

Build advanced fixtures incrementally against the course’s evidence targets: a controlled demand profile for HPA, a bounded long-running request for termination, an independently restorable database target, and explicit artifact signing/trust material. Keep the starter branch free of finished learner configurations. A solution or instructor reference belongs in a separately controlled repository/branch, not in a disguised student exercise.

The runtime-security profile currently checks a Podman container. Kubernetes admission and signature verification remain direct-tool evidence exercises; the repository does not pretend to auto-grade those decisions.
