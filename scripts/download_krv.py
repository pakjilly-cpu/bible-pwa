#!/usr/bin/env python3
"""
Download complete 개역한글 (KRV) Bible from bolls.life API
and save in the app's JSON format.
"""
import ssl, urllib.request, json, os, time, sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Book definitions: (id, name, nameEn, shortName, chapters, testament, bolls_book_num)
BOOKS = [
    ("gen", "창세기", "Genesis", "창", 50, "old", 1),
    ("exo", "출애굽기", "Exodus", "출", 40, "old", 2),
    ("lev", "레위기", "Leviticus", "레", 27, "old", 3),
    ("num", "민수기", "Numbers", "민", 36, "old", 4),
    ("deu", "신명기", "Deuteronomy", "신", 34, "old", 5),
    ("jos", "여호수아", "Joshua", "수", 24, "old", 6),
    ("jdg", "사사기", "Judges", "삿", 21, "old", 7),
    ("rut", "룻기", "Ruth", "룻", 4, "old", 8),
    ("1sa", "사무엘상", "1 Samuel", "삼상", 31, "old", 9),
    ("2sa", "사무엘하", "2 Samuel", "삼하", 24, "old", 10),
    ("1ki", "열왕기상", "1 Kings", "왕상", 22, "old", 11),
    ("2ki", "열왕기하", "2 Kings", "왕하", 25, "old", 12),
    ("1ch", "역대상", "1 Chronicles", "대상", 29, "old", 13),
    ("2ch", "역대하", "2 Chronicles", "대하", 36, "old", 14),
    ("ezr", "에스라", "Ezra", "스", 10, "old", 15),
    ("neh", "느헤미야", "Nehemiah", "느", 13, "old", 16),
    ("est", "에스더", "Esther", "에", 10, "old", 17),
    ("job", "욥기", "Job", "욥", 42, "old", 18),
    ("psa", "시편", "Psalms", "시", 150, "old", 19),
    ("pro", "잠언", "Proverbs", "잠", 31, "old", 20),
    ("ecc", "전도서", "Ecclesiastes", "전", 12, "old", 21),
    ("sng", "아가", "Song of Solomon", "아", 8, "old", 22),
    ("isa", "이사야", "Isaiah", "사", 66, "old", 23),
    ("jer", "예레미야", "Jeremiah", "렘", 52, "old", 24),
    ("lam", "예레미야애가", "Lamentations", "애", 5, "old", 25),
    ("ezk", "에스겔", "Ezekiel", "겔", 48, "old", 26),
    ("dan", "다니엘", "Daniel", "단", 12, "old", 27),
    ("hos", "호세아", "Hosea", "호", 14, "old", 28),
    ("jol", "요엘", "Joel", "욜", 3, "old", 29),
    ("amo", "아모스", "Amos", "암", 9, "old", 30),
    ("oba", "오바댜", "Obadiah", "옵", 1, "old", 31),
    ("jon", "요나", "Jonah", "욘", 4, "old", 32),
    ("mic", "미가", "Micah", "미", 7, "old", 33),
    ("nam", "나훔", "Nahum", "나", 3, "old", 34),
    ("hab", "하박국", "Habakkuk", "합", 3, "old", 35),
    ("zep", "스바냐", "Zephaniah", "습", 3, "old", 36),
    ("hag", "학개", "Haggai", "학", 2, "old", 37),
    ("zec", "스가랴", "Zechariah", "슥", 14, "old", 38),
    ("mal", "말라기", "Malachi", "말", 4, "old", 39),
    ("mat", "마태복음", "Matthew", "마", 28, "new", 40),
    ("mrk", "마가복음", "Mark", "막", 16, "new", 41),
    ("luk", "누가복음", "Luke", "눅", 24, "new", 42),
    ("jhn", "요한복음", "John", "요", 21, "new", 43),
    ("act", "사도행전", "Acts", "행", 28, "new", 44),
    ("rom", "로마서", "Romans", "롬", 16, "new", 45),
    ("1co", "고린도전서", "1 Corinthians", "고전", 16, "new", 46),
    ("2co", "고린도후서", "2 Corinthians", "고후", 13, "new", 47),
    ("gal", "갈라디아서", "Galatians", "갈", 6, "new", 48),
    ("eph", "에베소서", "Ephesians", "엡", 6, "new", 49),
    ("php", "빌립보서", "Philippians", "빌", 4, "new", 50),
    ("col", "골로새서", "Colossians", "골", 4, "new", 51),
    ("1th", "데살로니가전서", "1 Thessalonians", "살전", 5, "new", 52),
    ("2th", "데살로니가후서", "2 Thessalonians", "살후", 3, "new", 53),
    ("1ti", "디모데전서", "1 Timothy", "딤전", 6, "new", 54),
    ("2ti", "디모데후서", "2 Timothy", "딤후", 4, "new", 55),
    ("tit", "디도서", "Titus", "딛", 3, "new", 56),
    ("phm", "빌레몬서", "Philemon", "몬", 1, "new", 57),
    ("heb", "히브리서", "Hebrews", "히", 13, "new", 58),
    ("jas", "야고보서", "James", "약", 5, "new", 59),
    ("1pe", "베드로전서", "1 Peter", "벧전", 5, "new", 60),
    ("2pe", "베드로후서", "2 Peter", "벧후", 3, "new", 61),
    ("1jn", "요한일서", "1 John", "요일", 5, "new", 62),
    ("2jn", "요한이서", "2 John", "요이", 1, "new", 63),
    ("3jn", "요한삼서", "3 John", "요삼", 1, "new", 64),
    ("jud", "유다서", "Jude", "유", 1, "new", 65),
    ("rev", "요한계시록", "Revelation", "계", 22, "new", 66),
]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'bible')

def fetch_chapter(book_num, chapter):
    url = f'https://bolls.life/get-text/KRV/{book_num}/{chapter}/'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    })
    resp = urllib.request.urlopen(req, context=ctx, timeout=30)
    data = json.loads(resp.read())
    return [v['text'] for v in sorted(data, key=lambda x: x['verse'])]

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    total_verses = 0

    for bid, name, nameEn, shortName, chapters, testament, bnum in BOOKS:
        print(f'📖 {name} ({bid}) - {chapters}장...', flush=True)
        book_data = {
            "id": bid,
            "name": name,
            "nameEn": nameEn,
            "shortName": shortName,
            "chapters": []
        }

        for ch in range(1, chapters + 1):
            retries = 3
            while retries > 0:
                try:
                    verses = fetch_chapter(bnum, ch)
                    book_data["chapters"].append(verses)
                    total_verses += len(verses)
                    sys.stdout.write(f'  {ch}장: {len(verses)}절\r')
                    sys.stdout.flush()
                    time.sleep(0.15)  # Rate limiting
                    break
                except Exception as e:
                    retries -= 1
                    if retries == 0:
                        print(f'\n  ❌ {name} {ch}장 실패: {e}')
                        book_data["chapters"].append([])
                    else:
                        time.sleep(2)

        # Save book JSON
        outpath = os.path.join(OUTPUT_DIR, f'{bid}.json')
        with open(outpath, 'w', encoding='utf-8') as f:
            json.dump(book_data, f, ensure_ascii=False, separators=(',', ':'))
        print(f'  ✅ {name} 완료 ({sum(len(ch) for ch in book_data["chapters"])}절)')

    # Save index
    index = [{
        "id": bid, "name": name, "nameEn": nameEn,
        "shortName": shortName, "chapters": chapters, "testament": testament
    } for bid, name, nameEn, shortName, chapters, testament, _ in BOOKS]

    with open(os.path.join(OUTPUT_DIR, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, separators=(',', ':'))

    print(f'\n🎉 완료! 총 {total_verses}절 다운로드')

if __name__ == '__main__':
    main()
