#!/usr/bin/env bash
# Sourced, not run: `outside_env <dir>` makes the current shell run pnpm the way a reader's
# shell would, for a check that uses only PUBLISHED packages in a temporary directory
# (`scripts/test-doc.sh --outside`, `scripts/test-playground-examples.sh`).
#
# - It unsets every `npm_config_*` / `pnpm_config_*` variable: `pnpm run` exports the
#   repository's configuration (`strictDepBuilds`, `minimumReleaseAge`) to its children that
#   way, and no reader has it.
# - It points XDG_CONFIG_HOME at an empty directory inside <dir>, so pnpm runs with its
#   defaults rather than the developer's global pnpm settings (~/.npmrc, with registry
#   credentials, is still read).
#
# With one exception to pnpm's defaults: that config directory exempts this repository's own
# packages (rocketh, @rocketh/*, hardhat-deploy) from `minimumReleaseAge`, which pnpm 11 sets to
# one day by default. Without it, a pnpm 11 run in the day after a release resolves the
# PREVIOUS release, so the check meant to verify a release would skip it. The reasoning is the
# one pnpm-workspace.yaml gives for the same exemption in the repository. A reader on pnpm 11
# does get the previous release for that day; nothing here can change what their pnpm does.
outside_env() {
	mkdir -p "$1/.config/pnpm" || return 1
	export XDG_CONFIG_HOME="$1/.config"
	# pnpm 11 reads its global settings from config.yaml; pnpm 10 has no release-age floor
	# by default, so it needs no equivalent.
	printf '%s\n' 'minimumReleaseAgeExclude:' '  - rocketh' "  - '@rocketh/*'" '  - hardhat-deploy' >"$XDG_CONFIG_HOME/pnpm/config.yaml"
	local name
	for name in $(compgen -e); do
		case "$name" in
		[nN][pP][mM]_[cC][oO][nN][fF][iI][gG]_* | [pP][nN][pP][mM]_[cC][oO][nN][fF][iI][gG]_*) unset "$name" ;;
		esac
	done
}
