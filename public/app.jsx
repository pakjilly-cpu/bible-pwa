const { useState, useEffect, useCallback, useRef, useMemo } = React;

// ══════════════════════════════════════
// DATA LOADING
// ══════════════════════════════════════
const dataCache = { books: null, hymnsIndex: null, hymnChunks: {}, bibleBooks: {}, englishBooks: {} };

async function loadBooksIndex() {
  if (dataCache.books) return dataCache.books;
  const res = await fetch('/data/bible/index.json');
  dataCache.books = await res.json();
  return dataCache.books;
}

async function loadBookData(bookId) {
  if (dataCache.bibleBooks[bookId]) return dataCache.bibleBooks[bookId];
  const res = await fetch(`/data/bible/${bookId}.json`);
  const data = await res.json();
  dataCache.bibleBooks[bookId] = data;
  return data;
}

async function loadEnglishBookData(bookId) {
  if (dataCache.englishBooks[bookId]) return dataCache.englishBooks[bookId];
  const res = await fetch(`/data/bible-en/${bookId}.json`);
  const data = await res.json();
  dataCache.englishBooks[bookId] = data;
  return data;
}

async function loadHymnsIndex() {
  if (dataCache.hymnsIndex) return dataCache.hymnsIndex;
  const res = await fetch('/data/hymns/index.json');
  dataCache.hymnsIndex = await res.json();
  return dataCache.hymnsIndex;
}

async function loadHymnChunk(hymnNumber) {
  const chunkIdx = Math.floor((hymnNumber - 1) / 100);
  if (dataCache.hymnChunks[chunkIdx]) return dataCache.hymnChunks[chunkIdx];
  const res = await fetch(`/data/hymns/chunk_${chunkIdx}.json`);
  const data = await res.json();
  dataCache.hymnChunks[chunkIdx] = data;
  return data;
}

async function getHymnLyrics(hymnNumber) {
  const chunk = await loadHymnChunk(hymnNumber);
  return chunk.find(h => h.number === hymnNumber);
}

// Famous verses for daily word
const famousVerses = [
  { ref: "요한복음 3:16", bookId: "jhn", ch: 3, v: 16 },
  { ref: "시편 23:1", bookId: "psa", ch: 23, v: 1 },
  { ref: "잠언 3:5", bookId: "pro", ch: 3, v: 5 },
  { ref: "빌립보서 4:13", bookId: "php", ch: 4, v: 13 },
  { ref: "이사야 40:31", bookId: "isa", ch: 40, v: 31 },
  { ref: "로마서 8:28", bookId: "rom", ch: 8, v: 28 },
  { ref: "마태복음 11:28", bookId: "mat", ch: 11, v: 28 },
  { ref: "여호수아 1:9", bookId: "jos", ch: 1, v: 9 },
  { ref: "예레미야 29:11", bookId: "jer", ch: 29, v: 11 },
  { ref: "시편 119:105", bookId: "psa", ch: 119, v: 105 },
  { ref: "히브리서 11:1", bookId: "heb", ch: 11, v: 1 },
  { ref: "고린도전서 13:4", bookId: "1co", ch: 13, v: 4 },
  { ref: "에베소서 2:8", bookId: "eph", ch: 2, v: 8 },
  { ref: "시편 46:10", bookId: "psa", ch: 46, v: 10 },
  { ref: "로마서 12:2", bookId: "rom", ch: 12, v: 2 },
  { ref: "갈라디아서 2:20", bookId: "gal", ch: 2, v: 20 },
  { ref: "시편 27:1", bookId: "psa", ch: 27, v: 1 },
  { ref: "요한복음 14:6", bookId: "jhn", ch: 14, v: 6 },
  { ref: "잠언 16:3", bookId: "pro", ch: 16, v: 3 },
  { ref: "시편 37:4", bookId: "psa", ch: 37, v: 4 },
  { ref: "마태복음 6:33", bookId: "mat", ch: 6, v: 33 },
  { ref: "시편 91:1", bookId: "psa", ch: 91, v: 1 },
  { ref: "요한복음 1:1", bookId: "jhn", ch: 1, v: 1 },
  { ref: "시편 139:14", bookId: "psa", ch: 139, v: 14 },
  { ref: "로마서 5:8", bookId: "rom", ch: 5, v: 8 },
  { ref: "이사야 41:10", bookId: "isa", ch: 41, v: 10 },
  { ref: "빌립보서 4:6", bookId: "php", ch: 4, v: 6 },
  { ref: "시편 34:8", bookId: "psa", ch: 34, v: 8 },
  { ref: "창세기 1:1", bookId: "gen", ch: 1, v: 1 },
  { ref: "요한복음 8:32", bookId: "jhn", ch: 8, v: 32 },
  { ref: "마태복음 28:20", bookId: "mat", ch: 28, v: 20 },
];

// Highlight color map
const highlightColors = [
  { id: 'yellow', color: '#FFEB3B', bg: 'rgba(255,235,59,0.25)' },
  { id: 'green', color: '#4CAF50', bg: 'rgba(76,175,80,0.2)' },
  { id: 'blue', color: '#2196F3', bg: 'rgba(33,150,243,0.2)' },
  { id: 'pink', color: '#E91E63', bg: 'rgba(233,30,99,0.15)' },
  { id: 'orange', color: '#FF9800', bg: 'rgba(255,152,0,0.2)' },
];
const highlightBgMap = {};
highlightColors.forEach(c => { highlightBgMap[c.id] = c.bg; });

// ══════════════════════════════════════
// PERSISTENCE (localStorage)
// ══════════════════════════════════════
function loadStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ══════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════
window.BibleApp = function BibleApp() {
  // Navigation
  const [screen, setScreen] = useState("home");
  const [mainTab, setMainTab] = useState("home");

  // Bible state
  const [booksIndex, setBooksIndex] = useState([]);
  const [testament, setTestament] = useState("old");
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [verses, setVerses] = useState(null);
  const [loadingVerses, setLoadingVerses] = useState(false);
  // Language
  const [bibleLang, setBibleLang] = useState(() => loadStorage('bibleLang', 'ko'));

  // Hymn state
  const [hymnsIndex, setHymnsIndex] = useState([]);
  const [hymnSearch, setHymnSearch] = useState("");
  const [selectedHymn, setSelectedHymn] = useState(null);
  const [hymnLyrics, setHymnLyrics] = useState(null);
  const [hymnViewMode, setHymnViewMode] = useState('lyrics');

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const isComposingRef = useRef(false);

  // UI state
  const [fontSize, setFontSize] = useState(() => loadStorage('fontSize', 17));
  const [darkMode, setDarkMode] = useState(() => loadStorage('darkMode', false));
  const [bookmarks, setBookmarks] = useState(() => loadStorage('bookmarks', []));
  const [readHistory, setReadHistory] = useState(() => loadStorage('readHistory', []));
  const [todayVerse, setTodayVerse] = useState(null);

  // Highlights & Memos
  const [highlights, setHighlights] = useState(() => loadStorage('highlights', {}));
  const [memos, setMemos] = useState(() => loadStorage('memos', {}));
  const [activeVerseMenu, setActiveVerseMenu] = useState(null);
  const [bookmarkTab, setBookmarkTab] = useState('bookmarks');

  // TTS
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsVerse, setTtsVerse] = useState(-1);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);

  const scrollRef = useRef(null);

  // Persist settings
  useEffect(() => { saveStorage('fontSize', fontSize); }, [fontSize]);
  useEffect(() => { saveStorage('darkMode', darkMode); }, [darkMode]);
  useEffect(() => { saveStorage('bookmarks', bookmarks); }, [bookmarks]);
  useEffect(() => { saveStorage('readHistory', readHistory); }, [readHistory]);
  useEffect(() => { saveStorage('bibleLang', bibleLang); }, [bibleLang]);
  useEffect(() => { saveStorage('highlights', highlights); }, [highlights]);
  useEffect(() => { saveStorage('memos', memos); }, [memos]);

  // Load initial data
  useEffect(() => {
    loadBooksIndex().then(setBooksIndex);
    loadHymnsIndex().then(setHymnsIndex);
  }, []);

  // Load today's verse
  useEffect(() => {
    const dayIdx = Math.floor(Date.now() / 86400000) % famousVerses.length;
    const verseRef = famousVerses[dayIdx];
    loadBookData(verseRef.bookId).then(book => {
      if (book && book.chapters[verseRef.ch - 1]) {
        const text = book.chapters[verseRef.ch - 1][verseRef.v - 1];
        setTodayVerse({ ...verseRef, text, bookName: book.name });
      }
    });
  }, []);

  // Load chapter verses (bilingual)
  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;
    setLoadingVerses(true);
    setVerses(null);
    setActiveVerseMenu(null);

    const loadKo = loadBookData(selectedBook.id);
    const loadEn = (bibleLang === 'en' || bibleLang === 'both')
      ? loadEnglishBookData(selectedBook.id).catch(() => null)
      : Promise.resolve(null);

    Promise.all([loadKo, loadEn]).then(([krData, enData]) => {
      const krCh = krData.chapters[selectedChapter - 1] || [];
      const enCh = enData?.chapters?.[selectedChapter - 1] || [];

      if (bibleLang === 'ko') {
        setVerses(krCh.map(text => ({ ko: text })));
      } else if (bibleLang === 'en') {
        setVerses(enCh.map(text => ({ en: text })));
      } else {
        const maxLen = Math.max(krCh.length, enCh.length);
        setVerses(Array.from({ length: maxLen }, (_, i) => ({
          ko: krCh[i] || '', en: enCh[i] || ''
        })));
      }
      setLoadingVerses(false);
      // Save to read history
      setReadHistory(prev => {
        const entry = { bookId: selectedBook.id, bookName: selectedBook.name, chapter: selectedChapter, date: new Date().toLocaleDateString('ko-KR') };
        const filtered = prev.filter(h => !(h.bookId === entry.bookId && h.chapter === entry.chapter));
        return [entry, ...filtered].slice(0, 50);
      });
    });
  }, [selectedBook, selectedChapter, bibleLang]);

  // Load hymn lyrics
  useEffect(() => {
    if (!selectedHymn) return;
    setHymnLyrics(null);
    setHymnViewMode('lyrics');
    getHymnLyrics(selectedHymn.n).then(data => {
      setHymnLyrics(data);
    });
  }, [selectedHymn]);

  // Stop TTS on navigation
  useEffect(() => {
    if (screen !== "reading" && screen !== "hymnDetail") {
      window.speechSynthesis?.cancel();
      setTtsPlaying(false); setTtsPaused(false); setTtsVerse(-1);
    }
  }, [screen]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Close verse menu on screen change
  useEffect(() => { setActiveVerseMenu(null); }, [screen, selectedChapter]);

  // Scroll to top on screen change
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [screen, selectedChapter]);

  // ── Theme ──
  const t = darkMode
    ? { bg: "#121212", card: "#1e1e1e", text: "#e0e0e0", sub: "#888", accent: "#66bb6a", accentBg: "rgba(102,187,106,0.1)", border: "#2a2a2a", header: "#1a1a1a", nav: "#1a1a1a", shadow: "rgba(0,0,0,0.3)", verseNum: "#66bb6a" }
    : { bg: "#f5f5f0", card: "#ffffff", text: "#1a1a1a", sub: "#888", accent: "#2d5a27", accentBg: "rgba(45,90,39,0.06)", border: "#e8e8e3", header: "#ffffff", nav: "#ffffff", shadow: "rgba(0,0,0,0.04)", verseNum: "#2d5a27" };

  // ── Navigation ──
  const navigate = (target) => {
    if (target === "home") { setMainTab("home"); setScreen("home"); }
    else if (target === "bible") { setMainTab("bible"); setScreen("books"); }
    else if (target === "hymn") { setMainTab("hymn"); setScreen("hymnList"); setSelectedHymn(null); setHymnLyrics(null); }
    else if (target === "search") { setMainTab("search"); setScreen("search"); }
    else if (target === "bookmarks") { setMainTab("bookmarks"); setScreen("bookmarks"); }
    else setScreen(target);
  };

  // ── Bookmark helpers ──
  const toggleBookmark = useCallback((type, data) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.key === data.key);
      if (exists) return prev.filter(b => b.key !== data.key);
      return [{ ...data, type, date: new Date().toLocaleDateString("ko-KR") }, ...prev];
    });
  }, []);
  const isBookmarked = useCallback((key) => bookmarks.some(b => b.key === key), [bookmarks]);

  // ── Highlight helpers ──
  const toggleHighlight = useCallback((bKey, colorId) => {
    setHighlights(prev => {
      const next = { ...prev };
      if (next[bKey] === colorId) delete next[bKey];
      else next[bKey] = colorId;
      return next;
    });
  }, []);

  const clearHighlight = useCallback((bKey) => {
    setHighlights(prev => {
      const next = { ...prev };
      delete next[bKey];
      return next;
    });
  }, []);

  // ── Memo helpers ──
  const saveMemo = useCallback((bKey, text) => {
    setMemos(prev => {
      if (!text || !text.trim()) {
        const next = { ...prev };
        delete next[bKey];
        return next;
      }
      return { ...prev, [bKey]: text };
    });
  }, []);

  // ── TTS ──
  const ttsStop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setTtsPlaying(false); setTtsPaused(false); setTtsVerse(-1);
  }, []);

  const ttsSpeak = useCallback((texts, startIdx = 0) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (startIdx >= texts.length) { ttsStop(); return; }
    setTtsPlaying(true); setTtsPaused(false); setTtsVerse(startIdx);
    const utter = new SpeechSynthesisUtterance(texts[startIdx]);
    utter.lang = bibleLang === 'en' ? "en-US" : "ko-KR";
    utter.rate = ttsSpeed;
    utter.onend = () => { if (startIdx + 1 < texts.length) ttsSpeak(texts, startIdx + 1); else ttsStop(); };
    utter.onerror = () => ttsStop();
    window.speechSynthesis.speak(utter);
  }, [ttsSpeed, ttsStop, bibleLang]);

  const ttsTogglePause = useCallback(() => {
    if (!window.speechSynthesis) return;
    if (ttsPaused) { window.speechSynthesis.resume(); setTtsPaused(false); }
    else { window.speechSynthesis.pause(); setTtsPaused(true); }
  }, [ttsPaused]);

  // ── Search (bilingual) ──
  const doSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const q = query.trim().toLowerCase();
    const results = [];

    // Search hymns first (fast - from index)
    const hIndex = dataCache.hymnsIndex || [];
    hIndex.forEach(h => {
      if (h.t.toLowerCase().includes(q) || h.n.toString() === q) {
        results.push({ type: "hymn", number: h.n, title: h.t, vid: h.v });
      }
    });

    // Search Bible
    const books = dataCache.books || [];
    for (const book of books) {
      try {
        const data = await loadBookData(book.id);
        let enData = null;
        if (bibleLang === 'en' || bibleLang === 'both') {
          try { enData = await loadEnglishBookData(book.id); } catch {}
        }
        for (let ci = 0; ci < data.chapters.length; ci++) {
          const ch = data.chapters[ci];
          const enCh = enData?.chapters?.[ci] || [];
          for (let vi = 0; vi < ch.length; vi++) {
            const koMatch = ch[vi].toLowerCase().includes(q);
            const enMatch = enCh[vi] && enCh[vi].toLowerCase().includes(q);
            if (koMatch || enMatch) {
              results.push({
                type: "verse", bookId: book.id, bookName: book.name,
                chapter: ci + 1, verse: vi + 1,
                text: ch[vi], textEn: enCh[vi] || ''
              });
              if (results.length >= 100) break;
            }
          }
          if (results.length >= 100) break;
        }
      } catch {}
      if (results.length >= 100) break;
    }

    setSearchResults(results);
    setSearching(false);
  }, [bibleLang]);

  // Filtered hymns
  const filteredHymns = useMemo(() => {
    if (!hymnSearch.trim()) return hymnsIndex;
    const q = hymnSearch.trim().toLowerCase();
    return hymnsIndex.filter(h =>
      h.t.toLowerCase().includes(q) || h.n.toString().includes(q)
    );
  }, [hymnsIndex, hymnSearch]);

  // ══════════════════════════════════════
  // COMPONENTS
  // ══════════════════════════════════════

  // ── Shared Components ──
  const Header = ({ title, showBack, backTarget, right }) => (
    <div style={{ background: t.header, borderBottom: `1px solid ${t.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
        {showBack && <button onClick={() => navigate(backTarget || "home")} style={{ background: "none", border: "none", fontSize: 24, color: t.accent, cursor: "pointer", padding: "2px 8px 2px 0", lineHeight: 1 }}>‹</button>}
        <span style={{ fontSize: 17, fontWeight: 700, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>{right}</div>
    </div>
  );

  const Pill = ({ active, label, onClick, small }) => (
    <button onClick={onClick} style={{ padding: small ? "6px 14px" : "8px 18px", borderRadius: 20, border: `1.5px solid ${active ? t.accent : t.border}`, background: active ? t.accentBg : "transparent", color: active ? t.accent : t.sub, fontWeight: active ? 600 : 400, fontSize: small ? 12 : 13, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  // ── HOME SCREEN ──
  const HomeScreen = () => (
    <div style={{ paddingBottom: 90 }}>
      {/* Hero */}
      <div style={{ padding: "32px 20px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📖</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: t.text, letterSpacing: -0.5 }}>말씀과 함께</h1>
        <p style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>성경 66권 (한/영) · 찬송가 645곡</p>
      </div>

      {/* Today's Verse */}
      {todayVerse && (
        <div onClick={() => { const book = booksIndex.find(b => b.id === todayVerse.bookId); if (book) { setSelectedBook(book); setSelectedChapter(todayVerse.ch); setMainTab("bible"); setScreen("reading"); }}} style={{ margin: "0 16px 16px", padding: "20px", background: darkMode ? "linear-gradient(135deg, #1b3a1a, #1a2e1a)" : "linear-gradient(135deg, #eef5ee, #f0f7ec)", borderRadius: 16, cursor: "pointer", border: `1px solid ${darkMode ? '#2a4a2a' : '#d5e8d0'}` }}>
          <div style={{ fontSize: 10, color: t.accent, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>TODAY'S VERSE</div>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: t.text, wordBreak: "keep-all" }}>"{todayVerse.text}"</p>
          <p style={{ fontSize: 12, color: t.accent, fontWeight: 600, marginTop: 10 }}>— {todayVerse.ref}</p>
        </div>
      )}

      {/* Quick Access */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 10 }}>바로가기</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: "📜", label: "창세기", bookId: "gen", ch: 1 },
            { icon: "🎵", label: "시편", bookId: "psa", ch: 1 },
            { icon: "✨", label: "요한복음", bookId: "jhn", ch: 1 },
            { icon: "📕", label: "마태복음", bookId: "mat", ch: 1 },
            { icon: "💌", label: "로마서", bookId: "rom", ch: 1 },
            { icon: "🔥", label: "요한계시록", bookId: "rev", ch: 1 },
          ].map((item, i) => (
            <button key={i} onClick={() => { const book = booksIndex.find(b => b.id === item.bookId); if (book) { setSelectedBook(book); setSelectedChapter(item.ch); setMainTab("bible"); setScreen("reading"); }}} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "14px 12px", textAlign: "left", cursor: "pointer", boxShadow: `0 1px 3px ${t.shadow}` }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{item.label} {item.ch}장</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Reading */}
      {readHistory.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 10 }}>최근 읽은 말씀</h3>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {readHistory.slice(0, 8).map((h, i) => (
              <button key={i} onClick={() => { const book = booksIndex.find(b => b.id === h.bookId); if (book) { setSelectedBook(book); setSelectedChapter(h.chapter); setMainTab("bible"); setScreen("reading"); }}} style={{ flexShrink: 0, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: "nowrap" }}>{h.bookName} {h.chapter}장</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Hymns */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 10 }}>인기 찬송가</h3>
        {[305, 204, 320, 288, 259].map((num) => {
          const h = hymnsIndex.find(x => x.n === num);
          if (!h) return null;
          return (
            <button key={num} onClick={() => { setSelectedHymn(h); setMainTab("hymn"); setScreen("hymnDetail"); }} style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: t.accent, flexShrink: 0 }}>{h.n}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{h.t}</div>
            </button>
          );
        })}
      </div>

      {/* Settings */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 14 }}>설정</h3>
          {/* Language */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: t.text }}>성경 언어</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ id: 'ko', label: '한글' }, { id: 'en', label: 'English' }, { id: 'both', label: '한영' }].map(opt => (
                <button key={opt.id} onClick={() => setBibleLang(opt.id)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 12, border: `1px solid ${bibleLang === opt.id ? t.accent : t.border}`, background: bibleLang === opt.id ? t.accentBg : "transparent", color: bibleLang === opt.id ? t.accent : t.sub, fontWeight: bibleLang === opt.id ? 600 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Font size */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: t.text }}>글자 크기</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setFontSize(f => Math.max(13, f - 1))} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${t.border}`, background: "transparent", cursor: "pointer", color: t.text, fontSize: 16 }}>−</button>
              <span style={{ fontSize: 13, minWidth: 22, textAlign: "center", color: t.text }}>{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(26, f + 1))} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${t.border}`, background: "transparent", cursor: "pointer", color: t.text, fontSize: 16 }}>+</button>
            </div>
          </div>
          {/* Dark mode */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: t.text }}>다크 모드</span>
            <button onClick={() => setDarkMode(!darkMode)} style={{ width: 48, height: 26, borderRadius: 13, border: "none", background: darkMode ? t.accent : t.border, cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: darkMode ? 25 : 3, transition: "all 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── BIBLE BOOKS SCREEN ──
  const BooksScreen = () => {
    const books = booksIndex.filter(b => testament === "old" ? b.testament === "old" : b.testament === "new");
    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "12px 16px", display: "flex", gap: 8, position: "sticky", top: 0, background: t.bg, zIndex: 50, borderBottom: `1px solid ${t.border}` }}>
          <Pill active={testament === "old"} label="구약 (39)" onClick={() => setTestament("old")} />
          <Pill active={testament === "new"} label="신약 (27)" onClick={() => setTestament("new")} />
        </div>
        <div style={{ padding: "12px 12px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {books.map(book => (
            <button key={book.id} onClick={() => { setSelectedBook(book); setScreen("chapters"); }} style={{ padding: "12px 4px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", textAlign: "center", boxShadow: `0 1px 2px ${t.shadow}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{book.shortName}</div>
              <div style={{ fontSize: 10, color: t.sub, marginTop: 2 }}>{book.chapters}장</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── CHAPTERS SCREEN ──
  const ChaptersScreen = () => {
    if (!selectedBook) return null;
    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "18px 16px 12px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{selectedBook.name}</h2>
          <p style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{selectedBook.nameEn} · {selectedBook.chapters}장</p>
        </div>
        <div style={{ padding: "4px 12px 16px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
            <button key={ch} onClick={() => { setSelectedChapter(ch); setScreen("reading"); }} style={{ padding: "12px 0", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", fontSize: 15, fontWeight: 500, color: t.text, fontFamily: "inherit", boxShadow: `0 1px 2px ${t.shadow}` }}>
              {ch}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── VERSE ACTION MENU (highlight + memo) ──
  const VerseActionMenu = ({ bKey }) => {
    const [memoText, setMemoText] = useState(memos[bKey] || '');
    const [showMemoEditor, setShowMemoEditor] = useState(false);

    return (
      <div style={{ padding: "10px 12px", background: darkMode ? '#2a2a2a' : '#fafaf5', border: `1px solid ${t.border}`, borderRadius: 10, marginTop: 6 }}>
        {/* Highlight colors */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: t.sub, marginRight: 2 }}>형광펜</span>
          {highlightColors.map(c => (
            <button key={c.id} onClick={(e) => { e.stopPropagation(); toggleHighlight(bKey, c.id); }} style={{
              width: 26, height: 26, borderRadius: "50%", background: c.color, border: highlights[bKey] === c.id ? '2.5px solid #333' : '1.5px solid #ccc', cursor: "pointer", padding: 0
            }} />
          ))}
          {highlights[bKey] && (
            <button onClick={(e) => { e.stopPropagation(); clearHighlight(bKey); }} style={{ fontSize: 11, color: t.sub, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>✕</button>
          )}
        </div>
        {/* Memo */}
        <div>
          <button onClick={(e) => { e.stopPropagation(); setShowMemoEditor(!showMemoEditor); }} style={{ fontSize: 12, color: t.accent, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
            {memos[bKey] ? '📝 메모 수정' : '📝 메모 추가'}
          </button>
          {showMemoEditor && (
            <div style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
              <textarea value={memoText} onChange={e => setMemoText(e.target.value)} placeholder="메모를 입력하세요..."
                style={{ width: "100%", minHeight: 60, borderRadius: 8, border: `1px solid ${t.border}`, padding: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", background: t.card, color: t.text }} />
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <button onClick={() => { saveMemo(bKey, memoText); setShowMemoEditor(false); setActiveVerseMenu(null); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: t.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
                {memos[bKey] && <button onClick={() => { saveMemo(bKey, ''); setMemoText(''); setShowMemoEditor(false); setActiveVerseMenu(null); }} style={{ padding: "5px 14px", borderRadius: 6, border: `1px solid #e74c3c`, background: "transparent", color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── READING SCREEN ──
  const ReadingScreen = () => {
    if (!selectedBook || !selectedChapter) return null;
    const bookName = selectedBook.name;
    const langLabel = bibleLang === 'ko' ? '개역한글' : bibleLang === 'en' ? 'KJV' : '한영대조';

    // Get TTS texts based on language
    const getTtsTexts = () => {
      if (!verses) return [];
      if (bibleLang === 'ko') return verses.map(v => v.ko).filter(Boolean);
      if (bibleLang === 'en') return verses.map(v => v.en).filter(Boolean);
      // both: read Korean then English per verse
      const texts = [];
      verses.forEach(v => {
        if (v.ko) texts.push(v.ko);
        if (v.en) texts.push(v.en);
      });
      return texts;
    };

    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${t.border}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{bookName} {selectedChapter}장</h2>
          <p style={{ fontSize: 11, color: t.sub }}>{langLabel}</p>
          {/* Language toggle */}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <Pill active={bibleLang === 'ko'} label="한글" onClick={() => setBibleLang('ko')} small />
            <Pill active={bibleLang === 'en'} label="English" onClick={() => setBibleLang('en')} small />
            <Pill active={bibleLang === 'both'} label="한영" onClick={() => setBibleLang('both')} small />
          </div>
        </div>

        {/* TTS Bar */}
        {verses && verses.length > 0 && (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${t.border}`, background: t.accentBg, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {!ttsPlaying ? (
              <button onClick={() => ttsSpeak(getTtsTexts(), 0)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 16px", borderRadius: 20, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ▶ 읽어주기
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={ttsTogglePause} style={{ padding: "7px 14px", borderRadius: 20, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {ttsPaused ? "▶ 계속" : "⏸ 일시정지"}
                </button>
                <button onClick={ttsStop} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${t.accent}`, background: "transparent", color: t.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  ■ 정지
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
              {[0.7, 1.0, 1.3].map(spd => (
                <button key={spd} onClick={() => setTtsSpeed(spd)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${ttsSpeed === spd ? t.accent : t.border}`, background: ttsSpeed === spd ? t.accentBg : "transparent", color: ttsSpeed === spd ? t.accent : t.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {spd === 0.7 ? "느림" : spd === 1.0 ? "보통" : "빠름"}
                </button>
              ))}
            </div>
            {ttsPlaying && ttsVerse >= 0 && (
              <div style={{ width: "100%", marginTop: 4 }}>
                <div style={{ height: 2, borderRadius: 1, background: t.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: t.accent, width: `${((ttsVerse + 1) / verses.length) * 100}%`, transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: 10, color: t.sub, marginTop: 3 }}>{ttsVerse + 1}/{verses.length}절</p>
              </div>
            )}
          </div>
        )}

        {loadingVerses ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: t.sub, fontSize: 13 }}>말씀을 불러오고 있습니다...</p>
          </div>
        ) : verses && verses.length > 0 ? (
          <div style={{ padding: "12px 16px" }}>
            {verses.map((verseObj, i) => {
              const vNum = i + 1;
              const bKey = `v-${selectedBook.id}-${selectedChapter}-${vNum}`;
              const isReading = ttsPlaying && ttsVerse === i;
              const hlColor = highlights[bKey];
              const hasMemo = !!memos[bKey];
              const isMenuOpen = activeVerseMenu === bKey;

              return (
                <div key={i} style={{ display: "flex", gap: 0, marginBottom: 2, padding: "8px 8px", borderRadius: 8, background: hlColor ? highlightBgMap[hlColor] : (isReading ? `${t.accent}18` : "transparent"), transition: "background 0.3s", borderLeft: isReading ? `3px solid ${t.accent}` : "3px solid transparent" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.verseNum, minWidth: 28, paddingTop: 5, opacity: 0.7, flexShrink: 0 }}>{vNum}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Korean text */}
                    {verseObj.ko && (
                      <p onClick={() => { if (!ttsPlaying) setActiveVerseMenu(isMenuOpen ? null : bKey); else ttsSpeak(getTtsTexts(), i); }}
                        style={{ fontSize, lineHeight: 1.85, margin: 0, wordBreak: "keep-all", color: t.text, cursor: "pointer" }}>
                        {verseObj.ko}
                      </p>
                    )}
                    {/* English text */}
                    {verseObj.en && (
                      <p onClick={() => { if (!ttsPlaying) setActiveVerseMenu(isMenuOpen ? null : bKey); }}
                        style={{ fontSize: bibleLang === 'both' ? fontSize - 1 : fontSize, lineHeight: 1.75, margin: bibleLang === 'both' ? "4px 0 0" : 0, wordBreak: "break-word", color: bibleLang === 'both' ? t.sub : t.text, fontStyle: bibleLang === 'both' ? "italic" : "normal", cursor: "pointer" }}>
                        {verseObj.en}
                      </p>
                    )}
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleBookmark("verse", { key: bKey, bookId: selectedBook.id, bookName: selectedBook.name, chapter: selectedChapter, verse: vNum, text: verseObj.ko || verseObj.en || '' }); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "#e74c3c", padding: 0, opacity: isBookmarked(bKey) ? 0.9 : 0.35 }}>
                        {isBookmarked(bKey) ? "♥" : "♡"}
                      </button>
                      {hasMemo && <span style={{ fontSize: 11, opacity: 0.6 }}>📝</span>}
                      <button onClick={(e) => { e.stopPropagation(); setActiveVerseMenu(isMenuOpen ? null : bKey); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: t.sub, padding: 0, opacity: 0.5 }}>
                        ⋯
                      </button>
                    </div>
                    {/* Verse action menu */}
                    {isMenuOpen && <VerseActionMenu bKey={bKey} />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ color: t.sub, fontSize: 13 }}>말씀을 불러올 수 없습니다</p>
          </div>
        )}

        {/* Chapter Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px 20px", borderTop: `1px solid ${t.border}` }}>
          <button disabled={selectedChapter <= 1} onClick={() => { ttsStop(); setSelectedChapter(c => c - 1); }} style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: selectedChapter > 1 ? "pointer" : "default", color: t.text, fontFamily: "inherit", fontSize: 14, fontWeight: 600, opacity: selectedChapter <= 1 ? 0.3 : 1 }}>‹ 이전</button>
          <button onClick={() => setScreen("chapters")} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", color: t.sub, fontFamily: "inherit", fontSize: 13 }}>{selectedChapter}/{selectedBook.chapters}</button>
          <button disabled={selectedChapter >= selectedBook.chapters} onClick={() => { ttsStop(); setSelectedChapter(c => c + 1); }} style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: selectedChapter < selectedBook.chapters ? "pointer" : "default", color: t.text, fontFamily: "inherit", fontSize: 14, fontWeight: 600, opacity: selectedChapter >= selectedBook.chapters ? 0.3 : 1 }}>다음 ›</button>
        </div>
      </div>
    );
  };

  // ── HYMN LIST SCREEN ──
  const [hymnRange, setHymnRange] = useState("all");
  const [hymnShowCount, setHymnShowCount] = useState(50);

  // Reset show count when filter changes
  useEffect(() => { setHymnShowCount(50); }, [hymnSearch, hymnRange]);

  const rangeFilteredHymns = useMemo(() => {
    let list = filteredHymns;
    if (hymnRange !== "all" && !hymnSearch.trim()) {
      const [start, end] = hymnRange.split("-").map(Number);
      list = list.filter(h => h.n >= start && h.n <= end);
    }
    return list;
  }, [filteredHymns, hymnRange, hymnSearch]);

  const HymnListScreen = () => (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "12px 16px", position: "sticky", top: 0, background: t.bg, zIndex: 50, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <input
            type="text" placeholder="찬송가 검색 (번호 또는 제목)" value={hymnSearch}
            onChange={e => setHymnSearch(e.target.value)}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.card, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", color: t.text }}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.35 }}>🔍</span>
        </div>
        {!hymnSearch.trim() && (
          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
            {[
              { id: "all", label: "전체" },
              { id: "1-100", label: "1~100" },
              { id: "101-200", label: "101~200" },
              { id: "201-300", label: "201~300" },
              { id: "301-400", label: "301~400" },
              { id: "401-500", label: "401~500" },
              { id: "501-645", label: "501~645" },
            ].map(r => (
              <Pill key={r.id} active={hymnRange === r.id} label={r.label} onClick={() => setHymnRange(r.id)} small />
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: "8px 16px" }}>
        <p style={{ fontSize: 11, color: t.sub, marginBottom: 8 }}>새찬송가 ({rangeFilteredHymns.length}곡)</p>
        {rangeFilteredHymns.slice(0, hymnShowCount).map((h) => (
          <button key={h.n} onClick={() => { setSelectedHymn(h); setScreen("hymnDetail"); }} style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 5, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: t.accent, flexShrink: 0 }}>{h.n}</div>
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.t}</div>
            </div>
            {h.v && <span style={{ fontSize: 14, color: t.sub, flexShrink: 0 }}>▶</span>}
          </button>
        ))}
        {hymnShowCount < rangeFilteredHymns.length && (
          <button onClick={() => setHymnShowCount(c => c + 50)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", color: t.accent, fontSize: 13, fontWeight: 600, fontFamily: "inherit", marginTop: 4 }}>
            더 보기 ({rangeFilteredHymns.length - hymnShowCount}곡 남음)
          </button>
        )}
      </div>
    </div>
  );

  // ── HYMN DETAIL SCREEN ──
  const HymnDetailScreen = () => {
    if (!selectedHymn) return null;
    const bKey = `hymn-${selectedHymn.n}`;
    const lyrics = hymnLyrics?.lyrics || "";
    const lyricsLines = lyrics.split("\n");
    const [sheetError, setSheetError] = useState(false);
    const [showYT, setShowYT] = useState(false);
    const sheetUrl = `/data/hymns/sheets/${String(selectedHymn.n).padStart(3, '0')}.jpg`;

    return (
      <div style={{ paddingBottom: 90 }}>
        {/* Header info */}
        <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: t.accent }}>{selectedHymn.n}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: 0 }}>{selectedHymn.t}</h2>
              <p style={{ fontSize: 12, color: t.sub, margin: "2px 0 0" }}>새찬송가 {selectedHymn.n}장</p>
            </div>
            {/* Bookmark - heart only */}
            <button onClick={() => toggleBookmark("hymn", { key: bKey, title: selectedHymn.t, number: selectedHymn.n, text: selectedHymn.t })} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#e74c3c", padding: "4px", opacity: isBookmarked(bKey) ? 1 : 0.4 }}>
              {isBookmarked(bKey) ? "♥" : "♡"}
            </button>
          </div>

          {/* View mode tabs + YouTube */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Pill active={hymnViewMode === 'lyrics'} label="가사" onClick={() => setHymnViewMode('lyrics')} small />
            <Pill active={hymnViewMode === 'sheet'} label="악보" onClick={() => { setHymnViewMode('sheet'); setSheetError(false); }} small />
            {selectedHymn.v && (
              <button onClick={() => setShowYT(!showYT)} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${showYT ? '#cc0000' : t.border}`, background: showYT ? '#ff000010' : "transparent", color: showYT ? "#cc0000" : t.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {showYT ? "▶ 닫기" : "▶ 듣기"}
              </button>
            )}
          </div>
        </div>

        {/* YouTube Embed */}
        {showYT && selectedHymn.v && (
          <div style={{ padding: "0", background: "#000" }}>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${selectedHymn.v}?autoplay=1&rel=0`}
                title={selectedHymn.t}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* TTS for Hymn */}
        {lyrics && hymnViewMode === 'lyrics' && (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${t.border}`, background: t.accentBg, display: "flex", alignItems: "center", gap: 8 }}>
            {!ttsPlaying ? (
              <button onClick={() => { const lines = lyricsLines.filter(l => l.trim()); ttsSpeak(lines, 0); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 16px", borderRadius: 20, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ▶ 가사 읽기
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={ttsTogglePause} style={{ padding: "7px 14px", borderRadius: 20, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {ttsPaused ? "▶ 계속" : "⏸"}
                </button>
                <button onClick={ttsStop} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${t.accent}`, background: "transparent", color: t.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>■</button>
              </div>
            )}
          </div>
        )}

        {/* Content area */}
        {hymnViewMode === 'sheet' ? (
          /* Sheet music view */
          <div style={{ padding: "16px", textAlign: "center" }}>
            {!sheetError ? (
              <img
                src={sheetUrl}
                alt={`${selectedHymn.t} 악보`}
                onError={() => setSheetError(true)}
                style={{ maxWidth: "100%", borderRadius: 8, boxShadow: `0 2px 8px ${t.shadow}` }}
                loading="lazy"
              />
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.15 }}>🎵</div>
                <p style={{ color: t.sub, fontSize: 13 }}>악보를 불러올 수 없습니다</p>
              </div>
            )}
          </div>
        ) : (
          /* Lyrics view */
          !hymnLyrics ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ color: t.sub, fontSize: 13 }}>가사를 불러오고 있습니다...</p>
            </div>
          ) : (
            <div style={{ padding: "24px 20px" }}>
              {lyricsLines.map((line, i) => (
                <p key={i} style={{ fontSize, lineHeight: 2, color: line.match(/^\d+\./) ? t.accent : t.text, fontWeight: line.match(/^\d+\./) ? 600 : 400, margin: 0, textAlign: "center", minHeight: line.trim() === "" ? 20 : "auto" }}>
                  {line}
                </p>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  // ── SEARCH SCREEN ──
  const searchTimeout = useRef(null);
  const SearchScreen = () => (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "12px 16px", position: "sticky", top: 0, background: t.bg, zIndex: 50, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ position: "relative" }}>
          <input
            type="text" placeholder="성경 구절, 찬송가 검색..." value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (!isComposingRef.current) {
                clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => doSearch(e.target.value), 500);
              }
            }}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={e => {
              isComposingRef.current = false;
              clearTimeout(searchTimeout.current);
              searchTimeout.current = setTimeout(() => doSearch(e.target.value), 300);
            }}
            style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.card, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", color: t.text }}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.35 }}>🔍</span>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        {!searchQuery && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.15 }}>🔍</div>
            <p style={{ color: t.sub, fontSize: 13, marginBottom: 16 }}>성경과 찬송가를 함께 검색합니다</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {["사랑", "하나님", "은혜", "믿음", "영생", "평안", "소망", "축복"].map(word => (
                <button key={word} onClick={() => { setSearchQuery(word); doSearch(word); }} style={{ padding: "7px 14px", borderRadius: 18, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", fontSize: 12, color: t.text, fontFamily: "inherit" }}>{word}</button>
              ))}
            </div>
          </div>
        )}
        {searching && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
            <p style={{ color: t.sub, fontSize: 13 }}>검색 중...</p>
          </div>
        )}
        {searchResults.map((r, i) => (
          <button key={i} onClick={() => {
            if (r.type === "hymn") {
              setSelectedHymn({ n: r.number, t: r.title, v: r.vid });
              setMainTab("hymn"); setScreen("hymnDetail");
            } else {
              const book = booksIndex.find(b => b.id === r.bookId);
              if (book) { setSelectedBook(book); setSelectedChapter(r.chapter); setMainTab("bible"); setScreen("reading"); }
            }
          }} style={{ width: "100%", textAlign: "left", padding: "12px 14px", marginBottom: 6, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", fontFamily: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: r.type === "hymn" ? "#7b1fa220" : t.accentBg, color: r.type === "hymn" ? "#7b1fa2" : t.accent, fontWeight: 700 }}>
                {r.type === "hymn" ? "찬송" : "성경"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>
                {r.type === "hymn" ? `${r.number}장 ${r.title}` : `${r.bookName} ${r.chapter}:${r.verse}`}
              </span>
            </div>
            {r.text && <p style={{ fontSize: 13, color: t.text, lineHeight: 1.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.text}</p>}
            {r.textEn && <p style={{ fontSize: 12, color: t.sub, lineHeight: 1.4, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>{r.textEn}</p>}
          </button>
        ))}
        {searchQuery && !searching && searchResults.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: t.sub, fontSize: 13 }}>검색 결과가 없습니다</p>
          </div>
        )}
        {searchResults.length >= 100 && (
          <p style={{ textAlign: "center", color: t.sub, fontSize: 12, padding: "10px 0" }}>최대 100개 결과까지 표시됩니다</p>
        )}
      </div>
    </div>
  );

  // ── BOOKMARKS SCREEN (with memos tab) ──
  const BookmarksScreen = () => {
    const memoEntries = Object.entries(memos);
    const highlightEntries = Object.entries(highlights);

    return (
      <div style={{ paddingBottom: 90 }}>
        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 50 }}>
          <Pill active={bookmarkTab === 'bookmarks'} label={`북마크 (${bookmarks.length})`} onClick={() => setBookmarkTab('bookmarks')} small />
          <Pill active={bookmarkTab === 'memos'} label={`메모 (${memoEntries.length})`} onClick={() => setBookmarkTab('memos')} small />
          <Pill active={bookmarkTab === 'highlights'} label={`형광펜 (${highlightEntries.length})`} onClick={() => setBookmarkTab('highlights')} small />
        </div>

        <div style={{ padding: "16px" }}>
          {bookmarkTab === 'bookmarks' && (
            bookmarks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>♡</div>
                <p style={{ color: t.sub, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>저장된 항목이 없습니다</p>
                <p style={{ color: t.sub, fontSize: 12 }}>성경이나 찬송가에서 ♡를 눌러 저장하세요</p>
              </div>
            ) : (
              bookmarks.map((b, i) => (
                <div key={i} style={{ padding: "14px", marginBottom: 8, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: b.type === "hymn" ? "#7b1fa220" : t.accentBg, color: b.type === "hymn" ? "#7b1fa2" : t.accent, fontWeight: 700 }}>
                        {b.type === "hymn" ? "찬송" : "성경"}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.accent }}>
                        {b.type === "hymn" ? `${b.number}장 ${b.title}` : `${b.bookName} ${b.chapter}:${b.verse}`}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: t.sub }}>{b.date}</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: t.text, margin: 0 }}>{b.text?.substring(0, 80)}{b.text?.length > 80 ? "..." : ""}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <button onClick={() => {
                      if (b.type === "hymn") {
                        const h = hymnsIndex.find(x => x.n === b.number);
                        if (h) { setSelectedHymn(h); setMainTab("hymn"); setScreen("hymnDetail"); }
                      } else {
                        const book = booksIndex.find(bk => bk.id === b.bookId);
                        if (book) { setSelectedBook(book); setSelectedChapter(b.chapter); setMainTab("bible"); setScreen("reading"); }
                      }
                    }} style={{ background: "none", border: "none", fontSize: 12, color: t.accent, cursor: "pointer", fontWeight: 600, padding: 0 }}>이동 →</button>
                    <button onClick={() => toggleBookmark(b.type, b)} style={{ background: "none", border: "none", fontSize: 12, color: "#e74c3c", cursor: "pointer", padding: 0 }}>삭제</button>
                  </div>
                </div>
              ))
            )
          )}

          {bookmarkTab === 'memos' && (
            memoEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>📝</div>
                <p style={{ color: t.sub, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>저장된 메모가 없습니다</p>
                <p style={{ color: t.sub, fontSize: 12 }}>성경 구절에서 ⋯ 를 눌러 메모를 추가하세요</p>
              </div>
            ) : (
              memoEntries.map(([key, text]) => {
                const parts = key.split('-');
                const bookId = parts[1];
                const chapter = parseInt(parts[2]);
                const verse = parseInt(parts[3]);
                const book = booksIndex.find(b => b.id === bookId);
                return (
                  <div key={key} style={{ padding: "14px", marginBottom: 8, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.accent, marginBottom: 4 }}>
                      {book?.name || bookId} {chapter}:{verse}
                    </div>
                    <p style={{ fontSize: 13, color: t.text, lineHeight: 1.5, margin: 0 }}>{text}</p>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button onClick={() => {
                        if (book) { setSelectedBook(book); setSelectedChapter(chapter); setMainTab("bible"); setScreen("reading"); }
                      }} style={{ background: "none", border: "none", fontSize: 12, color: t.accent, cursor: "pointer", fontWeight: 600, padding: 0 }}>이동 →</button>
                      <button onClick={() => saveMemo(key, '')} style={{ background: "none", border: "none", fontSize: 12, color: "#e74c3c", cursor: "pointer", padding: 0 }}>삭제</button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {bookmarkTab === 'highlights' && (
            highlightEntries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>🖍</div>
                <p style={{ color: t.sub, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>형광펜 표시가 없습니다</p>
                <p style={{ color: t.sub, fontSize: 12 }}>성경 구절에서 ⋯ 를 눌러 형광펜을 칠하세요</p>
              </div>
            ) : (
              highlightEntries.map(([key, colorId]) => {
                const parts = key.split('-');
                const bookId = parts[1];
                const chapter = parseInt(parts[2]);
                const verse = parseInt(parts[3]);
                const book = booksIndex.find(b => b.id === bookId);
                const hlc = highlightColors.find(c => c.id === colorId);
                return (
                  <div key={key} style={{ padding: "14px", marginBottom: 8, borderRadius: 10, border: `1px solid ${t.border}`, background: hlc?.bg || t.card }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: hlc?.color || '#ccc' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.accent }}>
                        {book?.name || bookId} {chapter}:{verse}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                      <button onClick={() => {
                        if (book) { setSelectedBook(book); setSelectedChapter(chapter); setMainTab("bible"); setScreen("reading"); }
                      }} style={{ background: "none", border: "none", fontSize: 12, color: t.accent, cursor: "pointer", fontWeight: 600, padding: 0 }}>이동 →</button>
                      <button onClick={() => clearHighlight(key)} style={{ background: "none", border: "none", fontSize: 12, color: "#e74c3c", cursor: "pointer", padding: 0 }}>삭제</button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    );
  };

  // ── NAV BAR ──
  const NavBar = () => (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: t.nav, borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-around", padding: "4px 0 env(safe-area-inset-bottom, 8px)", zIndex: 100 }}>
      {[
        { id: "home", icon: "🏠", label: "홈" },
        { id: "bible", icon: "📖", label: "성경" },
        { id: "hymn", icon: "🎵", label: "찬송가" },
        { id: "search", icon: "🔍", label: "검색" },
        { id: "bookmarks", icon: "♥", label: "북마크" },
      ].map(item => (
        <button key={item.id} onClick={() => navigate(item.id)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, cursor: "pointer", padding: "6px 14px", color: mainTab === item.id ? t.accent : t.sub, transition: "all 0.2s" }}>
          <span style={{ fontSize: 20, color: item.id === "bookmarks" ? "#e74c3c" : undefined, opacity: item.id === "bookmarks" && mainTab !== item.id ? 0.5 : 1 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: mainTab === item.id ? 700 : 400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );

  // ── HEADER CONFIG ──
  const headerConfig = {
    home: { title: "말씀과 함께", showBack: false },
    books: { title: "성경", showBack: false },
    chapters: { title: selectedBook?.name || "", showBack: true, backTarget: "bible" },
    reading: {
      title: selectedBook ? `${selectedBook.name} ${selectedChapter}장` : "",
      showBack: true, backTarget: "chapters"
    },
    hymnList: { title: "찬송가", showBack: false },
    hymnDetail: { title: selectedHymn?.t || "", showBack: true, backTarget: "hymn" },
    search: { title: "검색", showBack: false },
    bookmarks: { title: "북마크", showBack: false },
  };
  const hdr = headerConfig[screen] || { title: "", showBack: false };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: t.bg, color: t.text, position: "relative", display: "flex", flexDirection: "column", transition: "background 0.3s, color 0.3s" }}>
      <Header title={hdr.title} showBack={hdr.showBack} backTarget={hdr.backTarget} right={hdr.right} />
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        {screen === "home" && <HomeScreen />}
        {screen === "books" && <BooksScreen />}
        {screen === "chapters" && <ChaptersScreen />}
        {screen === "reading" && <ReadingScreen />}
        {screen === "hymnList" && <HymnListScreen />}
        {screen === "hymnDetail" && <HymnDetailScreen />}
        {screen === "search" && <SearchScreen />}
        {screen === "bookmarks" && <BookmarksScreen />}
      </div>
      <NavBar />
    </div>
  );
};
