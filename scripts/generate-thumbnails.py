#!/usr/bin/env python3
"""
scripts/generate-thumbnails.py

Automated Liferay Fragment Thumbnail Generator.
Derives 320x180 (16:9) thumbnail.png files for all fragments in the repository:
- From verified desktop visual snapshots in docs/images/live/ or e2e-tests/snapshots/.
- Generates clean, styled schematic preview cards for headless/utility fragments.
- Ensures "thumbnailPath": "thumbnail.png" is declared in each fragment.json.
"""

import os
import re
import json
import glob
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

TARGET_WIDTH = 320
TARGET_HEIGHT = 180

def sanitize_name(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def get_collection_info(frag_dir: Path, root_dir: Path):
    curr = frag_dir.parent
    while curr != root_dir and curr != curr.parent:
        coll_json_path = curr / "main" / "collection.json"
        if not coll_json_path.exists():
            coll_json_path = curr / "collection.json"
        if coll_json_path.exists():
            try:
                with open(coll_json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get("name", curr.name), curr.name
            except Exception:
                pass
        curr = curr.parent
    return None, None

def crop_and_resize(image_path: Path, output_path: Path) -> bool:
    try:
        with Image.open(image_path) as im:
            im = im.convert("RGBA")
            w, h = im.size
            target_ratio = TARGET_WIDTH / TARGET_HEIGHT
            current_ratio = w / h

            if current_ratio > target_ratio:
                # Image is wider than 16:9, crop sides
                new_w = int(h * target_ratio)
                left = (w - new_w) // 2
                im_cropped = im.crop((left, 0, left + new_w, h))
            else:
                # Image is taller than 16:9, crop top/bottom with bias towards top
                new_h = int(w / target_ratio)
                top = 0 if h > new_h * 1.5 else (h - new_h) // 4
                im_cropped = im.crop((0, top, w, min(h, top + new_h)))

            im_resized = im_cropped.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
            im_resized.save(output_path, "PNG", optimize=True)
            return True
    except Exception as e:
        print(f"  [ERROR] Failed to resize {image_path}: {e}")
        return False

def generate_schematic_card(frag_name: str, collection_name: str, frag_type: str, output_path: Path) -> bool:
    try:
        # Create base image with theme dark navy
        img = Image.new("RGBA", (TARGET_WIDTH, TARGET_HEIGHT), (27, 42, 74, 255))
        draw = ImageDraw.Draw(img)

        # Draw card border and surface
        draw.rounded_rectangle(
            [(12, 12), (TARGET_WIDTH - 12, TARGET_HEIGHT - 12)],
            radius=8,
            fill=(38, 56, 92, 255),
            outline=(70, 95, 145, 255),
            width=2
        )

        # Header Pill / Badge
        badge_text = (collection_name or "UTILITY").upper()
        if len(badge_text) > 22:
            badge_text = badge_text[:20] + "..."
        draw.rounded_rectangle(
            [(24, 24), (24 + len(badge_text) * 7 + 16, 44)],
            radius=4,
            fill=(20, 32, 58, 255),
            outline=(90, 120, 180, 200),
            width=1
        )
        draw.text((32, 28), badge_text, fill=(140, 180, 255, 255))

        # Main Title (wrap if long)
        title = frag_name
        words = title.split()
        lines = []
        curr_line = []
        for word in words:
            curr_line.append(word)
            if len(" ".join(curr_line)) > 18:
                lines.append(" ".join(curr_line[:-1]))
                curr_line = [word]
        if curr_line:
            lines.append(" ".join(curr_line))

        lines = lines[:2]
        if len(lines) == 1:
            draw.text((TARGET_WIDTH // 2, 95), lines[0], fill=(255, 255, 255, 255), anchor="mm")
        elif len(lines) >= 2:
            draw.text((TARGET_WIDTH // 2, 85), lines[0], fill=(255, 255, 255, 255), anchor="mm")
            draw.text((TARGET_WIDTH // 2, 108), lines[1], fill=(255, 255, 255, 255), anchor="mm")

        # Type Subtitle Badge at bottom
        type_label = f"Type: {frag_type.capitalize() if frag_type else 'Component'}"
        draw.text((TARGET_WIDTH // 2, 145), type_label, fill=(170, 185, 215, 255), anchor="mm")

        img.save(output_path, "PNG", optimize=True)
        return True
    except Exception as e:
        print(f"  [ERROR] Failed to generate schematic card for {frag_name}: {e}")
        return False

def main():
    root_dir = Path(__file__).resolve().parent.parent
    print(f"Scanning fragments in: {root_dir}")

    fragment_files = list(root_dir.glob("**/fragment.json"))
    ignored_patterns = ["node_modules", "temp", "temp_*", "zips", "e2e-tests", ".git"]

    valid_frags = []
    for f in fragment_files:
        if any(ig in f.parts for ig in ignored_patterns):
            continue
        valid_frags.append(f)

    print(f"Found {len(valid_frags)} fragment manifests.")

    live_images_dir = root_dir / "docs" / "images" / "live"
    snapshots_dir = root_dir / "e2e-tests" / "snapshots"
    docs_images_dir = root_dir / "docs" / "images"

    derived_count = 0
    schematic_count = 0
    updated_manifests = 0

    for frag_json_path in sorted(valid_frags):
        frag_dir = frag_json_path.parent
        with open(frag_json_path, 'r', encoding='utf-8') as f:
            try:
                frag_data = json.load(f)
            except Exception as e:
                print(f"[WARN] Could not parse {frag_json_path}: {e}")
                continue

        frag_name = frag_data.get("name", frag_dir.name)
        frag_type = frag_data.get("type", "component")
        coll_display_name, coll_folder_name = get_collection_info(frag_dir, root_dir)

        safe_coll = sanitize_name(coll_display_name or coll_folder_name or "default")
        safe_frag = sanitize_name(frag_name)

        # Candidate snapshot paths
        candidate_paths = [
            live_images_dir / f"{safe_coll}-{safe_frag}-desktop.png",
            snapshots_dir / (coll_display_name or "") / f"{frag_name}-desktop.png",
            docs_images_dir / f"{safe_frag}.png",
            docs_images_dir / f"{safe_frag}-desktop.png",
            live_images_dir / f"{safe_frag}-desktop.png",
        ]

        found_snapshot = None
        for cand in candidate_paths:
            if cand.exists() and cand.is_file() and cand.stat().st_size > 0:
                found_snapshot = cand
                break

        thumbnail_output = frag_dir / "thumbnail.png"
        success = False

        if found_snapshot:
            success = crop_and_resize(found_snapshot, thumbnail_output)
            if success:
                derived_count += 1
        else:
            success = generate_schematic_card(
                frag_name=frag_name,
                collection_name=coll_display_name or coll_folder_name or "Fragment",
                frag_type=frag_type,
                output_path=thumbnail_output
            )
            if success:
                schematic_count += 1

        # Ensure thumbnailPath in fragment.json
        if frag_data.get("thumbnailPath") != "thumbnail.png":
            frag_data["thumbnailPath"] = "thumbnail.png"
            with open(frag_json_path, 'w', encoding='utf-8') as f:
                json.dump(frag_data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            updated_manifests += 1

    print("\n" + "=" * 40)
    print("Thumbnail Generation Complete:")
    print(f" - Derived from E2E Desktop Snapshots: {derived_count}")
    print(f" - Generated Schematic Preview Cards:  {schematic_count}")
    print(f" - Total Thumbnails Written:          {derived_count + schematic_count}")
    print(f" - Fragment Manifests Updated:        {updated_manifests}")
    print("=" * 40 + "\n")

if __name__ == "__main__":
    main()
