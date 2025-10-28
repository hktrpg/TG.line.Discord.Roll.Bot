import json
import re
import os
from typing import Any, Dict, List, Optional, Tuple


def get_nested(dct: Dict[str, Any], *keys: str, default: Any = None) -> Any:

    cur: Any = dct
    for key in keys:
        if isinstance(cur, dict) and key in cur:
            cur = cur[key]
        else:
            return default
    return cur


def to_int(value: Any) -> Optional[int]:

    try:
        return int(value)
    except Exception:
        return None


def normalize_case_dict(d: Any) -> Any:

    if isinstance(d, dict):
        return {str(k).lower(): normalize_case_dict(v) for k, v in d.items()}
    if isinstance(d, list):
        return [normalize_case_dict(v) for v in d]
    return d


_BUFFNAME_PREFIX_RE = re.compile(r"^(?:\{[^}]*\})+\s*")


def clean_buffname(name: str) -> str:

    if not isinstance(name, str):
        return name
    return _BUFFNAME_PREFIX_RE.sub("", name).strip()


def resolve_english_name(mapping_root: Dict[str, Any], mapping_key: str, item_id: Any) -> Optional[str]:

    if not isinstance(mapping_root, dict):
        return None
    lower = normalize_case_dict(mapping_root)
    # Prefer 'english' then 'eng' then 'en'
    for lang_key in ("english", "eng", "en"): 
        lang_map = lower.get(lang_key)
        if isinstance(lang_map, dict):
            name = lang_map.get(str(item_id))
            if isinstance(name, str):
                return name
    # Some datasets nest under mapping_key -> english
    node = lower.get(mapping_key)
    if isinstance(node, dict):
        for lang_key in ("english", "eng", "en"):
            lang_map = node.get(lang_key)
            if isinstance(lang_map, dict):
                name = lang_map.get(str(item_id))
                if isinstance(name, str):
                    return name
    return None


def convert_signature_entry(sig_id: str, level_value: Any, lookups: Dict[str, Any]) -> Dict[str, Any]:

    out: Dict[str, Any] = {"id": sig_id}
    level_num = to_int(level_value if not isinstance(level_value, dict) else get_nested(level_value, "level", default=None))
    if level_num is not None:
        out["level"] = level_num

    skill_data: Dict[str, Any] = lookups.get("skillData") or {}
    # skillData may be dict keyed by id strings
    skill_entry = None
    if isinstance(skill_data, dict):
        skill_entry = skill_data.get(sig_id) or skill_data.get(int(sig_id)) if sig_id.isdigit() else None
    if skill_entry is None and isinstance(skill_data, list):
        for item in skill_data:
            if isinstance(item, dict) and str(item.get("id")) == str(sig_id):
                skill_entry = item
                break
    if isinstance(skill_entry, dict):
        # Enrich buffset_x entries with buffnames via buffnames.english, keep other fields intact
        enriched_skill = dict(skill_entry)
        # prepare names lookup
        buffnames_root = lookups.get("buffnames") or {}
        names_node = None
        if isinstance(buffnames_root, dict):
            for lang_key in ("English", "english", "eng", "en"):
                node = buffnames_root.get(lang_key)
                if isinstance(node, dict):
                    names_node = node
                    break
            if names_node is None:
                names_node = normalize_case_dict(buffnames_root).get("english") if isinstance(buffnames_root, dict) else None

        # drop unwanted keys
        for drop_key in ("unknown_0", "unknown_1", "empty_0", "empty_1"):
            if drop_key in enriched_skill:
                enriched_skill.pop(drop_key, None)

        for k, v in list(enriched_skill.items()):
            if isinstance(k, str) and k.lower().startswith("buffset"):
                # remove null buffset_x
                if v is None:
                    enriched_skill.pop(k, None)
                    continue
                if isinstance(v, list):
                    new_list: List[Any] = []
                    for item in v:
                        if isinstance(item, dict):
                            eff_id = to_int(item.get("effect"))
                            rate = to_int(item.get("rate")) or 0
                            chg = to_int(item.get("changePercent")) or 0
                            turn = to_int(item.get("turnOverride")) or 0
                            # drop placeholder objects that are all zeros
                            if (eff_id or 0) == 0 and rate == 0 and chg == 0 and turn == 0:
                                continue
                            if isinstance(names_node, dict) and eff_id is not None and eff_id != 0:
                                nm = names_node.get(str(eff_id))
                                if isinstance(nm, str):
                                    item = dict(item)
                                    item["buffnames"] = clean_buffname(nm)
                        new_list.append(item)
                    if new_list:
                        enriched_skill[k] = new_list
                    else:
                        enriched_skill.pop(k, None)
                elif isinstance(v, dict):
                    item = dict(v)
                    eff_id = to_int(item.get("effect"))
                    rate = to_int(item.get("rate")) or 0
                    chg = to_int(item.get("changePercent")) or 0
                    turn = to_int(item.get("turnOverride")) or 0
                    # drop placeholder single object
                    if (eff_id or 0) == 0 and rate == 0 and chg == 0 and turn == 0:
                        enriched_skill.pop(k, None)
                    else:
                        if isinstance(names_node, dict) and eff_id is not None and eff_id != 0:
                            nm = names_node.get(str(eff_id))
                            if isinstance(nm, str):
                                item["buffnames"] = clean_buffname(nm)
                        enriched_skill[k] = item

        out["skillData"] = enriched_skill

    # Names/descriptions
    sig_moves = lookups.get("sigMoves") or {}
    move_name = None
    if isinstance(sig_moves, dict):
        # try direct english map
        for lang_key in ("English", "english", "eng", "en"):
            lang_map = sig_moves.get(lang_key)
            if isinstance(lang_map, dict):
                move_name = lang_map.get(str(sig_id))
                if isinstance(move_name, str):
                    break
    if not isinstance(move_name, str):
        # try generic resolver
        move_name = resolve_english_name(sig_moves, "sigmoves", sig_id)
    if isinstance(move_name, str):
        out["moveName"] = move_name

    move_descs = lookups.get("moveDescriptions") or lookups.get("moveDescription") or {}
    move_desc = None
    if isinstance(move_descs, dict):
        for lang_key in ("English", "english", "eng", "en"):
            lang_map = move_descs.get(lang_key)
            if isinstance(lang_map, dict):
                move_desc = lang_map.get(str(sig_id))
                if isinstance(move_desc, str):
                    break
    if isinstance(move_desc, str):
        out["moveDescriptionEnglish"] = move_desc

    # increasedDmgAgainstClass -> English name via classNames.english
    increased_against: List[int] = []
    if isinstance(skill_entry, dict):
        raw_inc = skill_entry.get("increasedDmgAgainstClass")
        if isinstance(raw_inc, list):
            for v in raw_inc:
                v_int = to_int(v)
                if v_int is not None:
                    increased_against.append(v_int)
        else:
            v_int = to_int(raw_inc)
            if v_int is not None:
                increased_against.append(v_int)
    if increased_against:
        # Use single value instead of array (take the first if multiple)
        out["increasedDmgAgainstClass"] = increased_against[0]
        class_names = lookups.get("classNames") or {}
        # classNames may be { english: { id: name } }
        names_node = None
        for lang_key in ("English", "english", "eng", "en"):
            node = class_names.get(lang_key)
            if isinstance(node, dict):
                names_node = node
                break
        if names_node is None and isinstance(class_names, dict):
            # try nested resolution
            names_node = normalize_case_dict(class_names).get("english")
        eng_name_single: Optional[str] = None
        if isinstance(names_node, dict):
            nm = names_node.get(str(increased_against[0]))
            if isinstance(nm, str):
                eng_name_single = nm
        if eng_name_single is not None:
            out["increasedDmgAgainstClassEng"] = eng_name_single

    # category via categoryNames.english if present on skill_entry
    if isinstance(skill_entry, dict):
        category_id = skill_entry.get("category") or skill_entry.get("categoryId")
        cat_id_int = to_int(category_id)
        if cat_id_int is not None:
            out["categoryId"] = cat_id_int
            category_names = lookups.get("categoryNames") or {}
            cat_name = None
            if isinstance(category_names, dict):
                for lang_key in ("English", "english", "eng", "en"):
                    lang_map = category_names.get(lang_key)
                    if isinstance(lang_map, dict):
                        cat_name = lang_map.get(str(cat_id_int))
                        if isinstance(cat_name, str):
                            break
            if isinstance(cat_name, str):
                out["categoryNameEnglish"] = cat_name

        # Collect buffsets -> effects and map to names via buffnames.english
        buff_effect_ids: List[int] = []
        for k, v in skill_entry.items():
            if isinstance(k, str) and k.lower().startswith("buffset") and isinstance(v, dict):
                eff = v.get("effect")
                if isinstance(eff, list):
                    for x in eff:
                        x_int = to_int(x)
                        if x_int is not None and x_int != 0:
                            buff_effect_ids.append(x_int)
                else:
                    x_int = to_int(eff)
                    if x_int is not None and x_int != 0:
                        buff_effect_ids.append(x_int)
        if buff_effect_ids:
            # Map to names using buffnames.english
            buffnames_root = lookups.get("buffnames") or {}
            names_node = None
            if isinstance(buffnames_root, dict):
                for lang_key in ("English", "english", "eng", "en"):
                    node = buffnames_root.get(lang_key)
                    if isinstance(node, dict):
                        names_node = node
                        break
                if names_node is None:
                    names_node = normalize_case_dict(buffnames_root).get("english") if isinstance(buffnames_root, dict) else None
            buff_names: List[str] = []
            if isinstance(names_node, dict):
                for bid in buff_effect_ids:
                    nm = names_node.get(str(bid))
                    if isinstance(nm, str):
                        buff_names.append(nm)
            # de-duplicate while preserving order
            seen = set()
            dedup: List[str] = []
            for nm in buff_names:
                if nm not in seen:
                    seen.add(nm)
                    dedup.append(nm)
            out["buffnames"] = dedup

    return out


def convert(source_path: str, output_path: str) -> None:

    with open(source_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    digi_data: Dict[str, Any] = data.get("digiData", {})

    # Optional lookup dictionaries
    lookups: Dict[str, Any] = {
        "skillData": data.get("skillData"),
        "sigMoves": data.get("sigMoves") or data.get("signatureMoves"),
        "classNames": data.get("classNames"),
        "categoryNames": data.get("categoryNames"),
        "moveDescriptions": data.get("moveDescriptions") or data.get("moveDescription"),
        "buffnames": data.get("buffnames") or data.get("buffNames"),
    }

    transformed: List[Dict[str, Any]] = []

    if isinstance(digi_data, dict):
        iterable = digi_data.values()
    elif isinstance(digi_data, list):
        iterable = digi_data
    else:
        iterable = []

    for entry in iterable:
        if not isinstance(entry, dict):
            continue

        base_stats = entry.get("baseStats", {}) or {}
        move_details = entry.get("moveDetails", {}) or {}
        inherited = move_details.get("inherited", {}) or {}
        signature = move_details.get("signature", {}) or {}

        # id from baseStats.fieldGuideId
        target: Dict[str, Any] = {
            "id": base_stats.get("fieldGuideId"),
            "name": entry.get("name"),
            "baseStats": {
                "basePersonality": base_stats.get("basePersonality"),
                "type": base_stats.get("type"),
                "level": base_stats.get("level"),
            },
            "conditions": entry.get("conditions", {}),
        }

        # inherited levels array
        levels: List[int] = []
        if isinstance(inherited, dict):
            for _move_id, lvl_obj in inherited.items():
                if isinstance(lvl_obj, dict):
                    lvl = to_int(lvl_obj.get("level"))
                else:
                    lvl = to_int(lvl_obj)
                if isinstance(lvl, int):
                    levels.append(lvl)
        target["inheritedLevels"] = levels

        # signature conversion
        sig_out: List[Dict[str, Any]] = []
        if isinstance(signature, dict):
            for sig_id, lvl_obj in signature.items():
                sig_out.append(convert_signature_entry(str(sig_id), lvl_obj, lookups))
        target["signature"] = sig_out

        transformed.append(target)

    # Sort by numeric id ascending
    def id_key(item: Dict[str, Any]) -> Tuple[int, str]:
        raw_id = item.get("id")
        try:
            return (int(raw_id), "")
        except Exception:
            return (1 << 30, str(raw_id))

    transformed.sort(key=id_key)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(transformed, f, ensure_ascii=False, indent=2)


def main() -> None:

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source = os.path.join(repo_root, "assets", "digmonsts", "digi_data.json")
    output = os.path.join(repo_root, "assets", "digmonsts", "digi_converted.json")
    convert(source, output)
    print(f"Wrote: {output}")


if __name__ == "__main__":
    main()


