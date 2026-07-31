#!/bin/sh
# Installs the pre-commit hook that stamps "Last Updated" dates.
#
# Written into .git/hooks directly rather than via core.hooksPath, because that
# setting would shadow .git/hooks and disable the Git LFS hooks living there.

set -eu

root=$(git rev-parse --show-toplevel)
hook="$root/.git/hooks/pre-commit"

if [ -e "$hook" ] && ! grep -q 'stamp-last-edited' "$hook"; then
    echo "A pre-commit hook already exists at $hook; not overwriting it." >&2
    echo "Add this line to it by hand:  ./scripts/stamp-last-edited.sh" >&2
    exit 1
fi

cat > "$hook" <<'EOF'
#!/bin/sh
exec "$(git rev-parse --show-toplevel)/scripts/stamp-last-edited.sh"
EOF

chmod +x "$hook"
echo "Installed $hook"
