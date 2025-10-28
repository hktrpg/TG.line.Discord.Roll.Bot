import argparse
import json
import os
import shutil
from copy import deepcopy
from datetime import datetime


def read_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def backup_file(path):
    directory, filename = os.path.split(path)
    name, ext = os.path.splitext(filename)
    timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S-%fZ")
    backup_name = f"{name}_backup_{timestamp}{ext}"
    backup_path = os.path.join(directory, backup_name)
    shutil.copy2(path, backup_path)
    return backup_path


def try_int(value):
    try:
        return int(str(value).strip())
    except Exception:
        return None


def deep_merge_no_overwrite(target, source, current_key=None):
    """
    Merge source into target without overwriting existing values.
    - If key missing in target: deep copy from source
    - If both values are dicts: recurse
    - If both values are lists: do not modify target (non-overwrite)
    - Otherwise: keep target as-is (non-overwrite)
    Returns target (modified in place) for convenience.
    """
    if not isinstance(target, dict) or not isinstance(source, dict):
        return target

    for key, src_val in source.items():
        if key not in target:
            target[key] = deepcopy(src_val)
            continue

        tgt_val = target[key]

        if isinstance(tgt_val, dict) and isinstance(src_val, dict):
            deep_merge_no_overwrite(tgt_val, src_val, current_key=key)
        elif isinstance(tgt_val, list) and isinstance(src_val, list):
            # Special handling for lists of special skills: merge by name without overwriting existing fields
            if key == "special_skills":
                # Build index by normalized name for target
                def norm_name(v):
                    try:
                        return str(v).strip().lower()
                    except Exception:
                        return None

                name_to_tgt_item = {}
                for item in tgt_val:
                    if isinstance(item, dict):
                        n = norm_name(item.get("name"))
                        if n:
                            name_to_tgt_item[n] = item

                for src_item in src_val:
                    if not isinstance(src_item, dict):
                        # For non-dict items, keep non-overwrite behavior (do nothing)
                        continue
                    src_name = norm_name(src_item.get("name"))
                    if src_name and src_name in name_to_tgt_item:
                        # Merge into existing item without overwriting
                        deep_merge_no_overwrite(name_to_tgt_item[src_name], src_item, current_key="special_skill_item")
                    else:
                        # Not present: clone/append
                        tgt_val.append(deepcopy(src_item))
            else:
                # Non-overwrite for other lists: do not modify existing list
                pass
        else:
            # Primitive or type mismatch: keep existing target value (no overwrite)
            pass

    return target


def build_index_by_id(records, id_field="id"):
    index = {}
    for rec in records:
        if not isinstance(rec, dict):
            continue
        key = try_int(rec.get(id_field))
        if key is None:
            continue
        index[key] = rec
    return index


def main():
    parser = argparse.ArgumentParser(description="Merge digi_converted.json into digimonSTS.json by id without overwriting existing fields.")
    parser.add_argument(
        "--converted",
        default=os.path.join("assets", "digmonsts", "digi_converted.json"),
        help="Path to digi_converted.json (ids as strings)",
    )
    parser.add_argument(
        "--sts",
        default=os.path.join("assets", "digmonsts", "digimonSTS.json"),
        help="Path to digimonSTS.json (ids as integers)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write changes, only print summary.",
    )
    args = parser.parse_args()

    # Read input files
    converted = read_json(args.converted)
    sts = read_json(args.sts)

    if not isinstance(converted, list):
        raise ValueError("digi_converted.json must be a list of objects")
    if not isinstance(sts, list):
        raise ValueError("digimonSTS.json must be a list of objects")

    # Index by integer ids
    converted_index = build_index_by_id(converted, id_field="id")

    merged_count = 0
    skipped_missing_id = 0
    for entry in sts:
        if not isinstance(entry, dict):
            continue
        entry_id = try_int(entry.get("id"))
        if entry_id is None:
            skipped_missing_id += 1
            continue
        src = converted_index.get(entry_id)
        if not src:
            continue
        # Merge into entry without overwriting
        before = json.dumps(entry, ensure_ascii=False, sort_keys=True)
        deep_merge_no_overwrite(entry, src)
        after = json.dumps(entry, ensure_ascii=False, sort_keys=True)
        if after != before:
            merged_count += 1

    # Backup files prior to write
    if not args.dry_run:
        backup_converted = backup_file(args.converted)
        backup_sts = backup_file(args.sts)
        write_json(args.sts, sts)
        print(f"Backed up converted to: {backup_converted}")
        print(f"Backed up sts to: {backup_sts}")
        print(f"Merged entries updated: {merged_count}")
        if skipped_missing_id:
            print(f"Skipped records without int-convertible id in sts: {skipped_missing_id}")
    else:
        print(f"[Dry Run] Would update {merged_count} entries. Skipped without id: {skipped_missing_id}")


if __name__ == "__main__":
    main()


