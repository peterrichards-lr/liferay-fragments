import re
import sys
from datetime import datetime
from pathlib import Path

# Match a footer line in either emphasis style.
#
# Prettier normalises markdown emphasis to underscores, so a footer written with
# asterisks comes back as `_Last Updated: ..._` on the next format pass. The
# original pattern matched asterisks only, so once Prettier had run the script no
# longer recognised its own footer and appended a second one. Repeated over time
# that produced duplicate footers in 184 tracked files (Issue #210). Matching
# both styles makes the script idempotent whichever form is already on disk.
FOOTER_REGEX = re.compile(
    r"[*_]Last Updated: ([\d\-]+)[*_] \| [*_]Last Reviewed: ([\d\-]+)[*_]"
)

# One footer block anchored to the END of the content, tolerating any spacing
# Prettier may have introduced and the `## ` that appears when `---` was parsed
# as a setext underline for the comment above it.
#
# Anchoring to the end matters: footers live at the end of a document, but
# example footers also appear *in the body* of docs that describe this very
# convention (docs-maintenance/SKILL.md shows one inside a fenced code block).
# An unanchored pattern strips those examples and corrupts the documentation.
TRAILING_FOOTER_REGEX = re.compile(
    r"\n*(?:#+[ \t]*)?<!--[ \t]*markdownlint-disable[ \t]+MD049[ \t]*-->[ \t]*\n+"
    r"(?:---[ \t]*\n+)?"
    r"[*_]Last Updated: ([\d\-]+)[*_] \| [*_]Last Reviewed: ([\d\-]+)[*_][ \t]*\n*\Z"
)

# A footer line at the end with no lint directive above it.
BARE_TRAILING_FOOTER_REGEX = re.compile(
    r"\n*(?:---[ \t]*\n+)?"
    r"[*_]Last Updated: ([\d\-]+)[*_] \| [*_]Last Reviewed: ([\d\-]+)[*_][ \t]*\n*\Z"
)


def build_footer(updated, reviewed):
    """Emit the footer already in Prettier's normalised form.

    Underscores rather than asterisks, and blank lines around the `---` so it is
    parsed as a thematic break rather than as a setext underline that would turn
    the comment above into a heading. Written this way the footer is a fixed
    point: Prettier leaves it alone, so it cannot drift out of sync with
    FOOTER_REGEX again.
    """
    return (
        "\n\n<!-- markdownlint-disable MD049 -->\n\n---\n\n"
        f"_Last Updated: {updated}_ | _Last Reviewed: {reviewed}_\n"
    )


def strip_trailing_footers(content):
    """Remove every footer stacked at the end, returning (body, updated, reviewed).

    Only the tail is considered, so body content is never modified.
    """
    updated = reviewed = None
    body = content
    while True:
        match = TRAILING_FOOTER_REGEX.search(body) or BARE_TRAILING_FOOTER_REGEX.search(
            body
        )
        if not match:
            break
        updated = max(filter(None, [updated, match.group(1)]))
        reviewed = max(filter(None, [reviewed, match.group(2)]))
        body = body[: match.start()]
    return body, updated, reviewed


def process_file(file_path, now_str, normalize_only=False):
    """Rewrite the trailing footer.

    normalize_only repairs the footer's shape — collapsing duplicates and
    restoring the lint directive — while leaving the recorded dates alone. That
    is what the one-off repair sweep needs: reformatting is not a content
    change, so stamping every file with today's date would erase real review
    history.
    """
    with open(file_path, encoding="utf-8") as f:
        content = f.read()

    body, updated, reviewed = strip_trailing_footers(content)

    if updated is None:
        if normalize_only:
            # Nothing to repair, and this mode must not invent a footer.
            return False
        updated = reviewed = now_str
    elif not normalize_only:
        updated = now_str

    new_content = body.rstrip() + build_footer(updated, reviewed)
    if new_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False


def main():
    now_str = datetime.now().strftime("%Y-%m-%d")
    args = sys.argv[1:]

    # --normalize repairs footer shape without touching the recorded dates.
    normalize_only = "--normalize" in args
    files_to_process = [a for a in args if a != "--normalize"]

    if not files_to_process:
        # If no arguments, fallback to rglob
        files_to_process = [str(p) for p in Path().rglob("*.md")]

    count = 0
    for file_path in files_to_process:
        # Exclude specific machine-generated or vendored trees. This previously
        # skipped every dot-directory, which silently excluded the documentation
        # under .agents/, .gemini/ and .github/, so their footers were never
        # maintained (Issue #210).
        parts = Path(file_path).parts
        if any(
            ignored in file_path
            for ignored in [
                "/.venv/",
                "/node_modules/",
                "/e2e-work-dir/",
                "/.smoke_venv/",
                "/temp_extract/",
                "/temp_inspect/",
            ]
        ) or parts[0] in {".git", ".venv", ".smoke_venv", "node_modules"}:
            continue

        if Path(file_path).suffix == ".md":
            if process_file(file_path, now_str, normalize_only):
                count += 1

    action = "Normalised footers" if normalize_only else "Updated timestamps"
    print(f"{action} for {count} files.")


if __name__ == "__main__":
    main()
