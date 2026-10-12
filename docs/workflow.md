# Your Git workflow

The clone already contains the starter’s history. Inspect that history rather than running `git init` in a cloned repository.

```bash
git status
git log --oneline -3
git config --local user.name "Your name"
git config --local user.email "you@example.com"
git switch -c inspect-workload
```

Replace the identity values. Name each branch for the investigation. Keep the application and evidence together; a report without the configuration that produced it is hard to review.

Stage the files you intend to submit and inspect the staged diff:

```bash
git status
git diff
git add evidence/baseline.md
git diff --cached
```

Review that diff before committing. When it contains your intended observations:

```bash
git commit -m "Record my baseline observations"
```

For an individual local workflow, return to `main` and fast-forward the completed task:

```bash
git switch main
git merge --ff-only inspect-workload
```

If the merge cannot fast-forward, inspect the graph and preserve your work before resolving the divergence. Do not reset to the instructor’s starter to erase a failed attempt. Capture that failure and its repair as evidence.

For a hosted cohort, fork the course repository when student-specific remotes are required. `origin` in a direct instructor clone may be read-only; do not assume it is your submission remote. Follow the instructor’s submission process and use the included pull-request template.

Create `checkpoint-0` on your own verified baseline commit after Module 0. Subsequent checkpoints should point at your actual work. The downloadable starter’s `starter-v0.1.0` tag identifies the supplied starting point.
