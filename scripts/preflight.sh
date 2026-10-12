#!/usr/bin/env bash
set -u
runtime=0
kubernetes=0
for arg in "$@"; do
  case "$arg" in
    --runtime) runtime=1 ;;
    --kubernetes) kubernetes=1 ;;
    --help) printf '%s\n' 'bash scripts/preflight.sh [--runtime] [--kubernetes]' 'Version checks run without Node.js. --runtime also executes the disposable Podman hello image.'; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$arg" >&2; exit 2 ;;
  esac
done
failures=0
check() {
  local label="$1"
  shift
  printf '\n%s\n' "$label"
  if "$@"; then printf '[PASS]\n'; else printf '[FAIL]\n'; failures=$((failures+1)); fi
}
if [[ "$(uname -s)" != Linux ]]; then
  printf '[FAIL] Run the labs in your prepared Linux environment (native Linux, Ubuntu WSL, or the Lima guest).\n'
  failures=$((failures+1))
fi
check 'Podman' podman --version
check 'Buildah' buildah --version
check 'Skopeo' skopeo --version
check 'OpenTofu' tofu version
check 'Git' git --version
check 'curl' curl --version
check 'Cloned Git workspace' git rev-parse --is-inside-work-tree
if (( runtime )); then check 'Container execution' podman run --rm quay.io/podman/hello; fi
if (( kubernetes )); then
  check 'kind' kind version
  check 'kubectl client' kubectl version --client
fi
printf '\nFailed checks: %s\n' "$failures"
printf '%s\n' 'Version strings do not prove runtime behavior. Review your guest allocation separately.'
(( failures == 0 ))
