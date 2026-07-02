import argparse
import re
import sys
from pathlib import Path
from datetime import datetime

def check_docs_review(max_review_days, max_update_days, max_gap_days):
    pattern = re.compile(r"\*Last Updated:\s*([\d\-]+)\*\s*\|\s*\*Last Reviewed:\s*([\d\-]+)\*")
    today = datetime.now()
    
    ignore_dirs = {".venv", "node_modules", ".smoke_venv", ".git", ".agents", "temp_extract", "temp_inspect"}
    root_dir = Path(".")
    
    errors = []
    
    for md_file in root_dir.rglob("*.md"):
        if any(part in ignore_dirs for part in md_file.parts):
            continue
            
        try:
            content = md_file.read_text(encoding="utf-8")
            match = pattern.search(content)
            if not match:
                # Missing timestamps footer entirely
                errors.append(f"{md_file}: Missing timestamp footer.")
                continue
                
            last_updated_str = match.group(1)
            last_reviewed_str = match.group(2)
            
            last_updated = datetime.strptime(last_updated_str, "%Y-%m-%d")
            last_reviewed = datetime.strptime(last_reviewed_str, "%Y-%m-%d")
            
            days_since_update = (today - last_updated).days
            days_since_review = (today - last_reviewed).days
            gap_days = abs((last_reviewed - last_updated).days)
            
            if max_update_days is not None and days_since_update > max_update_days:
                errors.append(f"{md_file}: Exceeds max update days ({days_since_update} > {max_update_days}).")
                
            if max_review_days is not None and days_since_review > max_review_days:
                errors.append(f"{md_file}: Exceeds max review days ({days_since_review} > {max_review_days}).")
                
            if max_gap_days is not None and gap_days > max_gap_days:
                errors.append(f"{md_file}: Exceeds max gap days between update and review ({gap_days} > {max_gap_days}).")
                
        except Exception as e:
            errors.append(f"{md_file}: Error reading or parsing file: {e}")
            
    if errors:
        print("Documentation review checks failed:")
        for error in errors:
            print(f" - {error}")
        sys.exit(1)
    else:
        print("All documentation review checks passed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Check markdown documentation review timestamps.")
    parser.add_argument("--max-review-days", type=int, help="Maximum days since last review.")
    parser.add_argument("--max-update-days", type=int, help="Maximum days since last update.")
    parser.add_argument("--max-gap-days", type=int, help="Maximum days difference between update and review.")
    
    args = parser.parse_args()
    check_docs_review(args.max_review_days, args.max_update_days, args.max_gap_days)
