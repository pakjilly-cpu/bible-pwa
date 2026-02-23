#!/usr/bin/env python3
"""
Convert KJV Bible JSON files from github.com/aruljohn/Bible-kjv
to the format used by our bible-pwa app.

KJV source format:
{
  "book": "Genesis",
  "chapters": [
    {"chapter": "1", "verses": [{"verse": "1", "text": "..."}, ...]},
    ...
  ]
}

Our target format:
{
  "id": "gen",
  "name": "Genesis",
  "nameEn": "Genesis",
  "shortName": "Gen",
  "chapters": [
    ["verse1text", "verse2text", ...],  // chapter 1
    ["verse1text", "verse2text", ...],  // chapter 2
    ...
  ]
}
"""

import json
import os
import sys

KJV_DIR = "/tmp/kjv-bible"
INDEX_FILE = "/home/parksh/bible-pwa/public/data/bible/index.json"
KOREAN_DIR = "/home/parksh/bible-pwa/public/data/bible"
OUTPUT_DIR = "/home/parksh/bible-pwa/public/data/bible-en"

# English short names for each book ID
SHORT_NAMES = {
    "gen": "Gen", "exo": "Exo", "lev": "Lev", "num": "Num", "deu": "Deu",
    "jos": "Jos", "jdg": "Jdg", "rut": "Rut", "1sa": "1Sa", "2sa": "2Sa",
    "1ki": "1Ki", "2ki": "2Ki", "1ch": "1Ch", "2ch": "2Ch", "ezr": "Ezr",
    "neh": "Neh", "est": "Est", "job": "Job", "psa": "Psa", "pro": "Pro",
    "ecc": "Ecc", "sng": "Sng", "isa": "Isa", "jer": "Jer", "lam": "Lam",
    "ezk": "Ezk", "dan": "Dan", "hos": "Hos", "jol": "Jol", "amo": "Amo",
    "oba": "Oba", "jon": "Jon", "mic": "Mic", "nam": "Nam", "hab": "Hab",
    "zep": "Zep", "hag": "Hag", "zec": "Zec", "mal": "Mal",
    "mat": "Mat", "mrk": "Mrk", "luk": "Luk", "jhn": "Jhn", "act": "Act",
    "rom": "Rom", "1co": "1Co", "2co": "2Co", "gal": "Gal", "eph": "Eph",
    "php": "Php", "col": "Col", "1th": "1Th", "2th": "2Th",
    "1ti": "1Ti", "2ti": "2Ti", "tit": "Tit", "phm": "Phm", "heb": "Heb",
    "jas": "Jas", "1pe": "1Pe", "2pe": "2Pe", "1jn": "1Jn", "2jn": "2Jn",
    "3jn": "3Jn", "jud": "Jud", "rev": "Rev",
}


def name_to_kjv_filename(name_en):
    """
    Convert our nameEn field to the KJV repo filename (without .json).
    e.g. "Song of Solomon" -> "SongofSolomon"
         "1 Samuel" -> "1Samuel"
    """
    return name_en.replace(" ", "")


def load_index():
    """Load the Korean bible index.json to get book ID mappings."""
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def convert_book(book_entry):
    """Convert a single KJV book JSON to our format."""
    book_id = book_entry["id"]
    name_en = book_entry["nameEn"]
    kjv_filename = name_to_kjv_filename(name_en) + ".json"
    kjv_path = os.path.join(KJV_DIR, kjv_filename)

    if not os.path.exists(kjv_path):
        print("  ERROR: KJV file not found: {}".format(kjv_path))
        return None

    with open(kjv_path, "r", encoding="utf-8") as f:
        kjv_data = json.load(f)

    # Convert chapters from KJV format to our format
    chapters = []
    for chapter_obj in kjv_data["chapters"]:
        # Sort verses by verse number to ensure correct order
        sorted_verses = sorted(chapter_obj["verses"], key=lambda v: int(v["verse"]))
        verse_texts = [v["text"] for v in sorted_verses]
        chapters.append(verse_texts)

    result = {
        "id": book_id,
        "name": name_en,
        "nameEn": name_en,
        "shortName": SHORT_NAMES.get(book_id, book_id.upper()),
        "chapters": chapters,
    }

    return result


def verify_book(book_id, en_data):
    """Verify English book against Korean counterpart. Returns list of issues."""
    issues = []
    kr_path = os.path.join(KOREAN_DIR, "{}.json".format(book_id))

    if not os.path.exists(kr_path):
        issues.append("Korean file not found: {}".format(kr_path))
        return issues

    with open(kr_path, "r", encoding="utf-8") as f:
        kr_data = json.load(f)

    kr_chapters = kr_data["chapters"]
    en_chapters = en_data["chapters"]

    if len(kr_chapters) != len(en_chapters):
        issues.append(
            "Chapter count mismatch: KR={}, EN={}".format(len(kr_chapters), len(en_chapters))
        )
    else:
        for i, (kr_ch, en_ch) in enumerate(zip(kr_chapters, en_chapters)):
            if len(kr_ch) != len(en_ch):
                issues.append(
                    "Ch {} verse count mismatch: KR={}, EN={}".format(i+1, len(kr_ch), len(en_ch))
                )

    return issues


def main():
    index = load_index()
    print("Loaded index with {} books".format(len(index)))

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Also create an English index.json
    en_index = []
    success_count = 0
    total_issues = []

    for book_entry in index:
        book_id = book_entry["id"]
        name_en = book_entry["nameEn"]
        print("Converting {}: {}...".format(book_id, name_en), end=" ")

        result = convert_book(book_entry)
        if result is None:
            print("FAILED")
            continue

        # Write the book JSON
        out_path = os.path.join(OUTPUT_DIR, "{}.json".format(book_id))
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False)

        # Verify against Korean data
        issues = verify_book(book_id, result)
        if issues:
            print("WARN: {}".format("; ".join(issues)))
            total_issues.extend([(book_id, issue) for issue in issues])
        else:
            print("OK ({} chapters)".format(len(result["chapters"])))

        success_count += 1

        # Build index entry
        en_index.append({
            "id": book_id,
            "name": name_en,
            "nameEn": name_en,
            "shortName": SHORT_NAMES.get(book_id, book_id.upper()),
            "chapters": len(result["chapters"]),
            "testament": book_entry.get("testament", "old"),
        })

    # Write English index
    index_path = os.path.join(OUTPUT_DIR, "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(en_index, f, ensure_ascii=False, indent=2)

    print("")
    print("=" * 60)
    print("Conversion complete: {}/{} books".format(success_count, len(index)))
    print("Output directory: {}".format(OUTPUT_DIR))
    print("Index file: {}".format(index_path))

    if total_issues:
        print("")
        print("Warnings ({}):".format(len(total_issues)))
        for book_id, issue in total_issues:
            print("  {}: {}".format(book_id, issue))

    # Specific verification checks
    print("")
    print("=" * 60)
    print("Verification checks:")

    # Genesis ch1 = 31 verses
    with open(os.path.join(OUTPUT_DIR, "gen.json")) as f:
        gen = json.load(f)
    gen_ch1_verses = len(gen["chapters"][0])
    status = "PASS" if gen_ch1_verses == 31 else "FAIL"
    print("  Genesis ch1 verses: {} (expected 31) {}".format(gen_ch1_verses, status))

    # Revelation ch22 = 21 verses
    with open(os.path.join(OUTPUT_DIR, "rev.json")) as f:
        rev = json.load(f)
    rev_ch22_verses = len(rev["chapters"][21])
    status = "PASS" if rev_ch22_verses == 21 else "FAIL"
    print("  Revelation ch22 verses: {} (expected 21) {}".format(rev_ch22_verses, status))

    # Total book count
    book_files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".json") and f != "index.json"]
    status = "PASS" if len(book_files) == 66 else "FAIL"
    print("  Total book files: {} (expected 66) {}".format(len(book_files), status))

    if total_issues:
        sys.exit(1)


if __name__ == "__main__":
    main()
