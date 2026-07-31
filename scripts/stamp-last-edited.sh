#!/bin/sh
# Stamps <p class="last-edited">Last Updated: ...</p> on each page from the git log.
#
# Run automatically by .git/hooks/pre-commit (install with scripts/install-hooks.sh).
#
#   (no args)   stamp only the pages staged in the commit being made, with today's
#               date -- the commit that will record them does not exist yet.
#   --all       backfill every page from the last commit that touched it, and leave
#               the results unstaged for review. Use this once after installing.

set -eu

cd "$(git rev-parse --show-toplevel)"

mode=${1:-staged}
months='January February March April May June July August September October November December'

format_date() {
    # 2026-07-31 -> July 31, 2026
    y=${1%%-*}
    rest=${1#*-}
    m=${rest%%-*}
    d=${rest#*-}
    printf '%s %s, %s' "$(echo "$months" | cut -d' ' -f"$((10#$m))")" "$((10#$d))" "$y"
}

stamp_file() {
    perl -0pi -e 's|(<p class="last-edited">)Last Updated:[^<]*|${1}Last Updated: '"$2"'|' "$1"
}

today=$(date +%Y-%m-%d)

if [ "$mode" = "--all" ]; then
    for file in $(git ls-files '*.html'); do
        grep -q 'class="last-edited"' "$file" || continue
        iso=$(git log -1 --format=%cs -- "$file")
        [ -n "$iso" ] || iso=$today
        stamp=$(format_date "$iso")
        stamp_file "$file" "$stamp"
        git diff --quiet -- "$file" || echo "stamped $file -> $stamp"
    done
    exit 0
fi

stamp=$(format_date "$today")

for file in $(git diff --cached --name-only --diff-filter=ACMR -- '*.html'); do
    [ -f "$file" ] || continue
    grep -q 'class="last-edited"' "$file" || continue

    # A file with edits held back from this commit must not be restaged, or those
    # edits get swept in. Stamp it anyway so the working copy stays consistent.
    if git diff --quiet -- "$file"; then
        partial=0
    else
        partial=1
    fi

    stamp_file "$file" "$stamp"

    if [ "$partial" = 1 ]; then
        echo "stamp-last-edited: $file is partially staged; stamped the working copy but did not restage it"
    elif ! git diff --quiet -- "$file"; then
        echo "stamp-last-edited: $file -> $stamp"
        git add "$file"
    fi
done
