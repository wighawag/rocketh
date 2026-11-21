#!/usr/bin/env bash
# Deploys every playground example (examples/playground/<name>/) the way the playground's
# Download would leave it, against the PUBLISHED packages:
#
#   bash scripts/test-playground-examples.sh [<name> ...]
#
# In a fresh temporary directory it scaffolds the starting project once with the released
# CLI (`pnpm dlx hardhat-deploy init --install`, the template the playground starts from) and
# then, for each example, makes a clean copy of it, writes the example's files over the copy,
# adds to its package.json every package the example imports that the starting project lacks,
# at its latest published version, and installs it (an example declares a package by importing
# it, see scripts/playground-example-packages.ts), then runs `pnpm hardhat compile` and
# `pnpm hardhat deploy` on Hardhat's in-memory network: a fresh chain, with the starting
# config's accounts. The install is done once and the copy
# carries it (a full copy, node_modules included, about a second), then is removed, so no
# example sees another's files, install or build output.
#
# It runs pnpm as a reader's shell would (scripts/outside-env.sh, shared with
# `scripts/test-doc.sh --outside`), runs every command with stdin detached so nothing waits
# for a human, never touches the checkout (pnpm-lock.yaml included), and removes the
# temporary directory whatever the outcome. It needs network access.
#
# Like `pnpm test:docs:hardhat-deploy-init`, it tests the last release by construction: an
# example using an option that is not released yet fails here, which is the point, since the
# playground only runs released packages. Whether a marked sample equals its example file is
# checked separately, by `pnpm test`.
set -u

cd "$(dirname "$0")/.."
repo=$(pwd)
examples="$repo/examples/playground"

names=()
if [ $# -gt 0 ]; then
	names=("$@")
else
	for dir in "$examples"/*/; do
		[ -d "$dir" ] && names+=("$(basename "$dir")")
	done
fi
if [ ${#names[@]} -eq 0 ]; then
	echo "test-playground-examples: no example in examples/playground/" >&2
	exit 1
fi
for name in "${names[@]}"; do
	if [ ! -d "$examples/$name" ]; then
		echo "test-playground-examples: no example named '$name' in examples/playground/" >&2
		exit 1
	fi
done

tsx="$repo/node_modules/.bin/tsx"
if [ ! -x "$tsx" ]; then
	echo "test-playground-examples: $tsx is missing; run pnpm install in the repository first" >&2
	exit 1
fi

workdir=$(mktemp -d) || exit 1
trap 'rm -rf "$workdir"' EXIT
. "$repo/scripts/outside-env.sh"
outside_env "$workdir" || exit 1

# Runs a command in a directory with stdin detached, bounded in time, echoing it first.
step() {
	local dir=$1
	shift
	echo "test-playground-examples: ($(basename "$dir")) $*"
	(cd "$dir" && timeout 900 "$@" </dev/null)
}

# An example declares a package by importing it (it carries no package.json): every package its
# files import that the starting project's package.json lacks is added to that package.json's
# devDependencies, at its latest published version, and installed. An example importing only
# the starting project's packages leaves package.json as it is, and installs nothing.
add_imported_packages() {
	local name=$1 run=$2 missing pkg version
	local specs=()
	missing=$("$tsx" "$repo/scripts/playground-example-packages.ts" missing "$examples/$name" "$run/package.json") || return 1
	[ -z "$missing" ] && return 0
	for pkg in $missing; do
		version=$(cd "$run" && timeout 120 pnpm view "$pkg" version </dev/null) || return 1
		[ -n "$version" ] || return 1
		echo "test-playground-examples: ($name) imports $pkg, which the starting project lacks: adding $pkg@^$version"
		specs+=("$pkg@^$version")
	done
	"$tsx" "$repo/scripts/playground-example-packages.ts" add "$run/package.json" "${specs[@]}" || return 1
	# --no-frozen-lockfile: package.json changed, and pnpm freezes the lockfile by default in CI.
	step "$run" pnpm install --no-frozen-lockfile
}

template="$workdir/starting-project"
if ! (cd "$workdir" && timeout 900 pnpm dlx hardhat-deploy init --install "$(basename "$template")" </dev/null); then
	echo "test-playground-examples: could not scaffold the starting project with the published hardhat-deploy init" >&2
	exit 1
fi

failed=()
for name in "${names[@]}"; do
	run="$workdir/examples/$name"
	mkdir -p "$run"
	# A clean copy of the starting project, installed (cp -a keeps pnpm's relative symlinks).
	cp -a "$template/." "$run/" || {
		failed+=("$name (copying the starting project)")
		continue
	}
	cp -R "$examples/$name/." "$run/" || {
		failed+=("$name (writing its files)")
		continue
	}
	if ! add_imported_packages "$name" "$run"; then
		failed+=("$name (adding the packages it imports)")
	elif ! step "$run" pnpm hardhat compile; then
		failed+=("$name (pnpm hardhat compile)")
	elif ! step "$run" pnpm hardhat deploy; then
		failed+=("$name (pnpm hardhat deploy)")
	else
		echo "test-playground-examples: $name deploys"
	fi
	rm -rf "$run"
done

if [ ${#failed[@]} -gt 0 ]; then
	echo "test-playground-examples: ${#failed[@]} of ${#names[@]} example(s) failed against the published packages:" >&2
	for f in "${failed[@]}"; do
		echo "  - examples/playground/$f" >&2
	done
	exit 1
fi
echo "test-playground-examples: all ${#names[@]} example(s) deploy against the published packages"
