#!/usr/bin/env bash
# Runs a documentation page (or some of its sections) with ezx, the way a reader would
# follow it.
#
#   bash scripts/test-doc.sh [--port <n>] [--outside] <page.md> <scaffold-dir> [section ...]
#
# By default the page scaffolds <scaffold-dir> INSIDE the repository, on purpose: there
# pnpm links the workspace packages instead of installing the published ones, so the run
# checks the documented flow against the code of this checkout (ADR 0008). Around that
# run it:
#
# - builds the workspace first. The linked packages are used through their `dist`, so a
#   stale build tests old code, and fails in ways that look like a broken page (a
#   checkout built before a dependency was renamed fails on `hardhat deploy` with a
#   misleading HHE202 peer-dependency error, hiding the real "Cannot find package").
# - snapshots pnpm-lock.yaml and pnpm-workspace.yaml and restores them, and removes the
#   scaffold, whatever the outcome (ADR 0008). The workspace file needs it too: an install
#   in the scaffold writes its build-script decisions (`pnpm add --allow-build`) into the
#   workspace root's pnpm-workspace.yaml, rewriting the file without its comments.
#
# --outside runs the page in a fresh temporary directory instead, for a page that only
# ever uses PUBLISHED packages (`pnpm dlx hardhat-deploy init` fetches the released CLI,
# which installs with the scaffold as its own workspace). Inside the repository such a
# page gains nothing from the links and inherits the repository's own pnpm settings
# (`strictDepBuilds`, `minimumReleaseAge`), which no reader has. Those settings reach the
# page even from a temporary directory: `pnpm run` exports the repository's configuration
# to its children as `npm_config_*` variables, so --outside unsets them. For the same
# reason it points XDG_CONFIG_HOME at an empty directory, so pnpm runs with its defaults
# rather than the developer's global pnpm settings (~/.npmrc, with registry credentials,
# is still read). It needs no build, and leaves the checkout untouched.
#
# In both modes it:
#
# - runs ezx with stdin detached, so a command that would wait for a human fails
#   instead of hanging.
# - runs ezx in a process group of its own and kills that whole group at the end, so a
#   node a page starts (`anvil`, with ezx's `async:` directive) never outlives the run,
#   even when a later step fails.
# - with --port, refuses to start when something already listens on that port (a page
#   that starts a node must not deploy to somebody else's), and checks that nothing
#   listens on it afterwards.
set -u

port=""
outside=false
while [ $# -gt 0 ]; do
	case "$1" in
	--port)
		port=$2
		shift 2
		;;
	--outside)
		outside=true
		shift
		;;
	*) break ;;
	esac
done
if [ $# -lt 2 ]; then
	echo "usage: bash scripts/test-doc.sh [--port <n>] [--outside] <page.md> <scaffold-dir> [section ...]" >&2
	exit 2
fi
page=$1
scaffold=$2
shift 2

cd "$(dirname "$0")/.."
repo=$(pwd)

listening() {
	(exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

if [ -n "$port" ] && listening "$port"; then
	echo "test-doc: something already listens on port $port, which $page starts a node on; stop it first" >&2
	exit 1
fi

if [ "$outside" = true ]; then
	workdir=$(mktemp -d) || exit 1
	mkdir "$workdir/.config"
	export XDG_CONFIG_HOME="$workdir/.config"
	for name in $(compgen -e); do
		case "$name" in
		[nN][pP][mM]_[cC][oO][nN][fF][iI][gG]_* | [pP][nN][pP][mM]_[cC][oO][nN][fF][iI][gG]_*) unset "$name" ;;
		esac
	done
else
	workdir=$repo
	if [ -e "$scaffold" ]; then
		echo "test-doc: '$scaffold' already exists; remove it first (it is what $page creates)" >&2
		exit 1
	fi
	pnpm build || exit 1
	lock=$(mktemp) || exit 1
	cp pnpm-lock.yaml "$lock"
	workspace=$(mktemp) || exit 1
	cp pnpm-workspace.yaml "$workspace"
fi

sections=()
for s in "$@"; do
	sections+=(-s "$s")
done

# Job control gives the background job a process group of its own, whose id is its pid.
set -m
(cd "$workdir" && exec "$repo/node_modules/.bin/ezx" --verbose --kill-on-complete "$repo/$page" ${sections[@]+"${sections[@]}"} </dev/null) &
pgid=$!
set +m
trap 'kill -TERM -- -"$pgid" 2>/dev/null' HUP INT TERM
wait "$pgid"
status=$?
trap - HUP INT TERM
kill -TERM -- -"$pgid" 2>/dev/null
sleep 1
kill -KILL -- -"$pgid" 2>/dev/null

if [ "$outside" = true ]; then
	rm -rf "$workdir"
else
	rm -rf "$scaffold"
	cp "$lock" pnpm-lock.yaml
	cp "$workspace" pnpm-workspace.yaml
	rm -f "$lock" "$workspace"
fi

if [ -n "$port" ] && listening "$port"; then
	echo "test-doc: something still listens on port $port after the run" >&2
	[ "$status" -eq 0 ] && status=1
fi
exit "$status"
