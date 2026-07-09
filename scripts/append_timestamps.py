import re
import sys
from datetime import datetime
from pathlib import Path

FOOTER_REGEX = re.compile(
    r"\*Last Updated: ([\d\-]+)\* \| \*Last Reviewed: ([\d\-]+)\*"
)


def process_file(file_path, now_str):
    with open(file_path, encoding="utf-8") as f:
        content = f.read()

    match = FOOTER_REGEX.search(content)
    if match:
        old_updated = match.group(1)
        if old_updated != now_str:
            new_footer = (
                f"*Last Updated: {now_str}* | *Last Reviewed: {match.group(2)}*"
            )
            new_content = content[: match.start()] + new_footer + content[match.end() :]
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            return True
    else:
        # Append if not exists
        content = content.rstrip()
        footer = f"\n\n<!-- markdownlint-disable MD049 -->\n---\n*Last Updated: {now_str}* | *Last Reviewed: {now_str}*\n"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content + footer)
        return True
    return False


def main():
    now_str = datetime.now().strftime("%Y-%m-%d")
    files_to_process = sys.argv[1:]

    if not files_to_process:
        # If no arguments, fallback to rglob
        files_to_process = [str(p) for p in Path().rglob("*.md")]

    count = 0
    for file_path in files_to_process:
        # Skip ignored directories
        if any(
            ignored in file_path
            for ignored in [
                "/.venv/",
                "/node_modules/",
                "/e2e-work-dir/",
                "/.smoke_venv/",
                "/temp_extract/",
                "/temp_inspect/"
            ]
        ) or Path(file_path).parts[0].startswith("."):
            continue

        if Path(file_path).suffix == ".md":
            if process_file(file_path, now_str):
                count += 1

    print(f"Updated timestamps for {count} files.")


if __name__ == "__main__":
    main()
