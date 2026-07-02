import os
from pathlib import Path
from datetime import datetime

def append_timestamps():
    today = datetime.now().strftime("%Y-%m-%d")
    footer = f"""
<!-- markdownlint-disable MD049 -->
---
*Last Updated: {today}* | *Last Reviewed: {today}*
"""
    
    ignore_dirs = {".venv", "node_modules", ".smoke_venv", ".git", ".agents", "temp_extract", "temp_inspect"}
    
    root_dir = Path(".")
    
    for md_file in root_dir.rglob("*.md"):
        # Check if file is in an ignored directory
        if any(part in ignore_dirs for part in md_file.parts):
            continue
            
        try:
            content = md_file.read_text(encoding="utf-8")
            if "*Last Updated:" not in content and "*Last Reviewed:" not in content:
                with open(md_file, "a", encoding="utf-8") as f:
                    # Ensure there's a newline before appending
                    if not content.endswith("\n"):
                        f.write("\n")
                    f.write(footer)
                print(f"Appended timestamps to: {md_file}")
        except Exception as e:
            print(f"Error processing {md_file}: {e}")

if __name__ == "__main__":
    append_timestamps()
