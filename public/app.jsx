const { useState, useEffect, useCallback, useRef, useMemo } = React;

// ══════════════════════════════════════
// YOUTUBE API KEY (발급 후 여기에 입력)
// ══════════════════════════════════════
const YOUTUBE_API_KEY = "AIzaSyDPQbSrAbrbh34uH8VW8qIs_W0pIZr45Ik";

// ══════════════════════════════════════
// DATA LOADING
// ══════════════════════════════════════
const dataCache = { books: null, hymnsIndex: null, hymnChunks: {}, bibleBooks: {}, englishBooks: {}, gHymnIndex: null, kHymnIndex: null };

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
  const res = await fetch(`/data/bible-en/${bookId}.json?v=2`);
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

async function loadGHymnIndex() {
  if (dataCache.gHymnIndex) return dataCache.gHymnIndex;
  const res = await fetch('/data/ghymn_index.json');
  dataCache.gHymnIndex = await res.json();
  return dataCache.gHymnIndex;
}

async function loadKHymnIndex() {
  if (dataCache.kHymnIndex) return dataCache.kHymnIndex;
  const res = await fetch('/data/khymn_index.json');
  dataCache.kHymnIndex = await res.json();
  return dataCache.kHymnIndex;
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

// Bible reading progress round colors
const readRoundColors = [
  { bg: 'rgba(255,235,59,0.22)', border: '#FFD54F', label: '1독' },
  { bg: 'rgba(76,175,80,0.18)', border: '#81C784', label: '2독' },
  { bg: 'rgba(33,150,243,0.18)', border: '#64B5F6', label: '3독' },
  { bg: 'rgba(233,30,99,0.14)', border: '#F06292', label: '4독' },
];

// 새찬송가→구찬송가 매핑 (통일찬송가 번호)
// 새찬송가→구찬송가 매핑 (성가대찬양 사이트 기준, 오디오 파일 번호로 사용)
const NEW2OLD = {1:1,2:6,3:2,4:4,5:3,6:8,8:9,9:53,10:34,12:22,14:30,15:55,19:44,20:41,21:21,22:26,23:23,25:25,26:14,27:27,28:28,29:29,31:46,32:48,33:12,34:45,35:50,36:36,37:37,39:39,40:43,42:11,43:57,44:56,46:58,49:72,50:71,53:59,54:61,55:62,56:60,58:66,59:68,60:67,64:13,65:19,66:20,67:31,68:32,69:33,70:79,71:438,73:73,74:74,75:47,78:75,79:40,80:101,81:452,82:90,83:83,84:96,85:85,86:86,87:87,88:88,89:89,90:98,91:91,92:97,93:93,94:102,95:82,96:94,101:106,102:107,104:104,105:105,108:113,109:109,111:111,112:112,114:114,115:115,116:116,117:117,118:118,119:119,120:120,121:121,122:122,123:123,125:125,126:126,130:42,131:24,132:38,134:84,135:133,138:52,139:128,140:130,141:132,143:141,144:144,145:145,146:146,147:136,148:142,149:147,150:135,151:138,154:139,159:149,160:150,161:159,162:151,163:160,164:154,165:155,166:156,167:157,168:158,170:16,172:152,174:161,175:162,176:163,177:164,179:167,180:168,182:169,183:172,184:173,185:179,186:176,187:171,188:180,189:181,190:177,191:427,195:175,196:174,197:178,198:284,199:234,200:235,201:240,202:241,204:379,205:236,207:243,208:246,209:247,210:245,211:346,212:347,213:348,214:349,215:354,216:356,217:362,218:369,219:279,220:278,221:525,222:524,225:298,227:283,228:285,229:281,232:282,234:220,235:222,236:223,237:226,239:230,240:231,241:232,242:233,243:224,245:228,246:221,249:249,250:182,251:137,252:184,254:186,255:187,257:189,258:190,259:193,260:194,261:195,262:196,263:197,264:198,265:199,266:200,267:201,268:202,269:211,270:214,272:330,273:331,274:332,275:333,276:334,277:335,278:336,279:337,280:338,282:339,283:183,284:206,285:209,286:218,287:205,288:204,289:208,290:412,291:413,292:415,293:414,294:416,295:417,297:191,298:35,299:418,300:406,301:460,302:408,303:403,304:404,305:405,309:409,310:410,311:185,312:341,313:352,314:511,315:512,317:353,320:350,321:351,322:357,323:355,324:360,325:359,326:368,327:361,328:374,329:267,330:370,331:375,333:381,336:383,337:363,338:364,339:365,340:366,341:367,342:395,345:461,346:398,347:382,348:388,349:387,350:393,351:389,352:390,353:391,354:394,355:386,356:396,357:397,358:400,359:401,360:402,361:480,362:481,363:479,364:482,365:484,366:485,368:486,369:487,370:455,371:419,372:420,373:503,374:423,375:421,376:422,377:451,378:430,379:429,380:424,381:425,382:432,383:433,384:434,385:435,386:439,387:440,388:441,390:444,391:446,393:447,394:449,395:450,397:454,400:463,401:457,404:477,405:458,406:464,407:465,408:466,410:468,411:473,412:469,413:470,414:475,415:471,417:476,419:478,420:212,421:210,423:213,424:216,425:217,426:215,427:516,428:488,429:489,430:456,432:462,433:490,434:491,435:492,436:493,438:495,439:496,440:497,441:498,442:499,445:502,446:500,447:448,449:377,450:376,451:504,452:505,453:506,454:508,455:507,456:509,457:510,458:513,459:514,460:515,461:519,462:517,463:518,465:523,471:528,472:530,475:272,478:78,479:290,480:293,481:531,482:49,483:532,484:533,485:534,486:474,487:535,488:539,489:541,490:542,491:543,492:544,493:545,494:188,495:271,496:260,497:274,498:275,499:277,500:258,501:255,502:259,503:373,504:266,505:268,507:273,508:270,509:314,510:276,511:263,512:328,515:256,516:265,518:252,519:251,520:257,521:253,522:269,523:262,524:313,525:315,526:316,527:317,528:319,529:320,530:321,531:323,532:323,534:324,535:325,536:326,537:329,538:327,539:483,540:219,542:340,543:342,544:343,545:344,546:399,549:431,550:248,551:296,552:358,554:297,559:305,563:411,564:299,565:300,566:301,567:436,569:442,570:453,574:303,575:302,579:304,580:371,582:261,585:384,586:521,587:306,588:307,589:308,590:309,591:310,592:311,593:312,595:372,597:378,598:244,600:242,602:286,604:288,605:287,606:291,607:292,608:295,610:289,631:547,632:549,635:548,638:70,639:550,640:554,641:552,643:554,644:557,645:556};
// 구찬송가→새찬송가 (역방향)
const OLD2NEW = {};
Object.entries(NEW2OLD).forEach(([n,o]) => { if (!OLD2NEW[o]) OLD2NEW[o] = parseInt(n); });
// 통일찬송가 번호→choir.gntc.net 이미지 파일번호 (40곡이 2페이지라 번호≠파일번호, API 236개 검증완료)
const OLD_2PAGE = new Set([46,51,84,133,152,179,187,195,211,224,226,228,236,249,253,268,274,281,302,311,319,371,373,375,379,385,387,394,404,406,414,417,419,420,434,473,476,480,519,530]);
const OLD2FILE = {47:48,48:49,49:50,50:51,51:52,52:54,53:55,54:56,55:57,56:58,57:59,58:60,59:61,60:62,61:63,62:64,63:65,64:66,65:67,66:68,67:69,68:70,69:71,70:72,71:73,72:74,73:75,74:76,75:77,76:78,77:79,78:80,79:81,80:82,81:83,82:84,83:85,84:86,85:88,86:89,87:90,88:91,89:92,90:93,91:94,92:95,93:96,94:97,95:98,96:99,97:100,98:101,99:102,100:103,101:104,102:105,103:106,104:107,105:108,106:109,107:110,108:111,109:112,110:113,111:114,112:115,113:116,114:117,115:118,116:119,117:120,118:121,119:122,120:123,121:124,122:125,123:126,124:127,125:128,126:129,127:130,128:131,129:132,130:133,131:134,132:135,133:136,134:138,135:139,136:140,137:141,138:142,139:143,140:144,141:145,142:146,143:147,144:148,145:149,146:150,147:151,148:152,149:153,150:154,151:155,152:156,153:158,154:159,155:160,156:161,157:162,158:163,159:164,160:165,161:166,162:167,163:168,164:169,165:170,166:171,167:172,168:173,169:174,170:175,171:176,172:177,173:178,174:179,175:180,176:181,177:182,178:183,179:184,180:186,181:187,182:188,183:189,184:190,185:191,186:192,187:193,188:195,189:196,190:197,191:198,192:199,193:200,194:201,195:202,196:204,197:205,198:206,199:207,200:208,201:209,202:210,203:211,204:212,205:213,206:214,207:215,208:216,209:217,210:218,211:219,212:221,213:222,214:223,215:224,216:225,217:226,218:227,219:228,220:229,221:230,222:231,223:232,224:233,225:235,226:236,227:238,228:239,229:241,230:242,231:243,232:244,233:245,234:246,235:247,236:248,237:250,238:251,239:252,240:253,241:254,242:255,243:256,244:257,245:258,246:259,247:260,248:261,249:262,250:264,251:265,252:266,253:267,254:269,255:270,256:271,257:272,258:273,259:274,260:275,261:276,262:277,263:278,264:279,265:280,266:281,267:282,268:283,269:285,270:286,271:287,272:288,273:289,274:290,275:292,276:293,277:294,278:295,279:296,280:297,281:298,282:300,283:301,284:302,285:303,286:304,287:305,288:306,289:307,290:308,291:309,292:310,293:311,294:312,295:313,296:314,297:315,298:316,299:317,300:318,301:319,302:320,303:322,304:323,305:324,306:325,307:326,308:327,309:328,310:329,311:330,312:332,313:333,314:334,315:335,316:336,317:337,318:338,319:339,320:341,321:342,322:343,323:344,324:345,325:346,326:347,327:348,328:349,329:350,330:351,331:352,332:353,333:354,334:355,335:356,336:357,337:358,338:359,339:360,340:361,341:362,342:363,343:364,344:365,345:366,346:367,347:368,348:369,349:370,350:371,351:372,352:373,353:374,354:375,355:376,356:377,357:378,358:379,359:380,360:381,361:382,362:383,363:384,364:385,365:386,366:387,367:388,368:389,369:390,370:391,371:392,372:394,373:395,374:397,375:398,376:400,377:401,378:402,379:403,380:405,381:406,382:407,383:408,384:409,385:410,386:412,387:413,388:415,389:416,390:417,391:418,392:419,393:420,394:421,395:423,396:424,397:425,398:426,399:427,400:428,401:429,402:430,403:431,404:432,405:434,406:435,407:437,408:438,409:439,410:440,411:441,412:442,413:443,414:444,415:446,416:447,417:448,418:450,419:451,420:453,421:455,422:456,423:457,424:458,425:459,426:460,427:461,428:462,429:463,430:464,431:465,432:466,433:467,434:468,435:470,436:471,437:472,438:473,439:474,440:475,441:476,442:477,443:478,444:479,445:480,446:481,447:482,448:483,449:484,450:485,451:486,452:487,453:488,454:489,455:490,456:491,457:492,458:493,459:494,460:495,461:496,462:497,463:498,464:499,465:500,466:501,467:502,468:503,469:504,470:505,471:506,472:507,473:508,474:510,475:511,476:512,477:514,478:515,479:516,480:517,481:519,482:520,483:521,484:522,485:523,486:524,487:525,488:526,489:527,490:528,491:529,492:530,493:531,494:532,495:533,496:534,497:535,498:536,499:537,500:538,501:539,502:540,503:541,504:542,505:543,506:544,507:545,508:546,509:547,510:548,511:549,512:550,513:551,514:552,515:553,516:554,517:555,518:556,519:557,520:559,521:560,522:561,523:562,524:563,525:564,526:565,527:566,528:567,529:568,530:569,531:571,532:572,533:573,534:574,535:575,536:576,537:577,538:578,539:579,540:580,541:581,542:582,543:583,544:584,545:585,546:586,547:587,548:588,549:589,550:590,551:591,552:592,553:593,554:594,555:595,556:596,557:597,558:598};

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
  const [sheetError, setSheetError] = useState(false);
  const hymnSearchInputRef = useRef(null);
  const hymnSearchTimeout = useRef(null);
  // Hymn category state
  const [hymnCategory, setHymnCategory] = useState(null); // null=category select, 'hymn','ghymn','khymn','choir'
  const [gHymnIndex, setGHymnIndex] = useState([]);
  const [kHymnIndex, setKHymnIndex] = useState([]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef(null);

  // UI state
  const [fontSize, setFontSize] = useState(() => loadStorage('fontSize', 17));
  const [darkMode, setDarkMode] = useState(() => loadStorage('darkMode', false));
  const [bookmarks, setBookmarks] = useState(() => loadStorage('bookmarks', []));
  const [readHistory, setReadHistory] = useState(() => loadStorage('readHistory', []));
  const [hymnHistory, setHymnHistory] = useState(() => loadStorage('hymnHistory', []));
  const [todayVerse, setTodayVerse] = useState(null);

  // Highlights & Memos
  const [highlights, setHighlights] = useState(() => loadStorage('highlights', {}));
  const [memos, setMemos] = useState(() => loadStorage('memos', {}));
  const [activeVerseMenu, setActiveVerseMenu] = useState(null);
  const [bookmarkTab, setBookmarkTab] = useState('bookmarks');

  // Bible reading plan (통독)
  const [biblePlan, setBiblePlan] = useState(() => loadStorage('biblePlan', null));
  const [bibleReads, setBibleReads] = useState(() => loadStorage('bibleReads', {}));
  const [fromTongdok, setFromTongdok] = useState(false);

  // TTS
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsVerse, setTtsVerse] = useState(-1);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [ttsError, setTtsError] = useState('');
  const ttsSpeedRef = useRef(ttsSpeed);
  const ttsTextsRef = useRef([]);
  const ttsVerseMapRef = useRef(null);
  const ttsLangMapRef = useRef(null);
  const ttsIdxRef = useRef(0);
  const ttsClickTimeRef = useRef(0);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sermon state
  const [sermonCategory, setSermonCategory] = useState("주일예배");
  const [sermonVideos, setSermonVideos] = useState({});
  const [sermonChannelId, setSermonChannelId] = useState(null);

  const [sermonLoading, setSermonLoading] = useState(false);

  const scrollRef = useRef(null);
  const tabStateRef = useRef({});

  // Persist settings
  useEffect(() => { saveStorage('fontSize', fontSize); }, [fontSize]);
  useEffect(() => { saveStorage('darkMode', darkMode); }, [darkMode]);
  useEffect(() => { saveStorage('bookmarks', bookmarks); }, [bookmarks]);
  useEffect(() => { saveStorage('readHistory', readHistory); }, [readHistory]);
  useEffect(() => { saveStorage('hymnHistory', hymnHistory); }, [hymnHistory]);
  useEffect(() => { saveStorage('bibleLang', bibleLang); }, [bibleLang]);
  useEffect(() => { saveStorage('highlights', highlights); }, [highlights]);
  useEffect(() => { saveStorage('memos', memos); }, [memos]);
  useEffect(() => { saveStorage('biblePlan', biblePlan); }, [biblePlan]);
  useEffect(() => { saveStorage('bibleReads', bibleReads); }, [bibleReads]);
  useEffect(() => { ttsSpeedRef.current = ttsSpeed; }, [ttsSpeed]);

  // Voice selection for TTS
  const voicesRef = useRef([]);
  useEffect(() => {
    const loadVoices = () => { voicesRef.current = window.speechSynthesis?.getVoices() || []; };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const getPreferredVoice = (lang) => {
    const voices = voicesRef.current;
    if (!voices.length) return null;
    const langVoices = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    if (!langVoices.length) return null;
    const female = langVoices.find(v => /female|yuna|sunhi|heami|samantha|google/i.test(v.name));
    return female || langVoices[0];
  };

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
      setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; window.scrollTo(0, 0); }, 50);
      // Save to read history
      setReadHistory(prev => {
        const entry = { bookId: selectedBook.id, bookName: selectedBook.name, chapter: selectedChapter, date: new Date().toLocaleDateString('ko-KR') };
        const filtered = prev.filter(h => !(h.bookId === entry.bookId && h.chapter === entry.chapter));
        return [entry, ...filtered].slice(0, 50);
      });
    });
  }, [selectedBook, selectedChapter, bibleLang]);

  // Load hymn lyrics + save to hymn history
  useEffect(() => {
    if (!selectedHymn) return;
    setHymnLyrics(null);
    setHymnViewMode('lyrics');
    if (hymnCategory === "hymn" || !hymnCategory) {
      getHymnLyrics(selectedHymn.n).then(data => {
        setHymnLyrics(data);
      });
    } else {
      // gHymn/kHymn: no lyrics data, just show title
      setHymnLyrics({ number: selectedHymn.n, title: selectedHymn.t, lyrics: "" });
    }
    // Save to hymn history
    setHymnHistory(prev => {
      const entry = { n: selectedHymn.n, t: selectedHymn.t, v: selectedHymn.v, date: new Date().toLocaleDateString('ko-KR') };
      const filtered = prev.filter(h => h.n !== entry.n);
      return [entry, ...filtered].slice(0, 20);
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

  // ── Swipe navigation between main tabs ──
  const mainTabs = ["home", "bible", "hymn", "worship", "tongdok", "bookmarks"];
  const swipeStartRef = useRef(null);
  const swipeTrackRef = useRef(false);
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    swipeTrackRef.current = true;
  }, []);
  const handleTouchEnd = useCallback((e) => {
    if (!swipeStartRef.current || !swipeTrackRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeStartRef.current.x;
    const dy = touch.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    const subScreens = ["chapters", "reading", "hymnDetail", "hymnList", "sermon", "familyWorship"];
    if (subScreens.includes(screen)) return;
    const idx = mainTabs.indexOf(mainTab);
    if (idx === -1) return;
    if (dx < 0 && idx < mainTabs.length - 1) navigate(mainTabs[idx + 1]);
    else if (dx > 0 && idx > 0) navigate(mainTabs[idx - 1]);
  }, [screen, mainTab]);

  // Scroll to top on screen/chapter change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [screen, selectedChapter]);

  // ── Back button (History API) ──
  const isPopstateRef = useRef(false);
  useEffect(() => {
    history.replaceState({ screen: "home", mainTab: "home" }, "");
    const handlePopState = (e) => {
      if (e.state) {
        isPopstateRef.current = true;
        setScreen(e.state.screen);
        setMainTab(e.state.mainTab);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect(() => {
    if (isPopstateRef.current) { isPopstateRef.current = false; return; }
    if (screen === "home" && mainTab === "home") return; // don't push initial state
    history.pushState({ screen, mainTab }, "");
  }, [screen]);

  // ── Theme ──
  const t = darkMode
    ? { bg: "#121212", card: "#1e1e1e", text: "#e0e0e0", sub: "#888", accent: "#66bb6a", accentBg: "rgba(102,187,106,0.1)", border: "#2a2a2a", header: "#1a1a1a", nav: "#1a1a1a", shadow: "rgba(0,0,0,0.3)", verseNum: "#66bb6a" }
    : { bg: "#f8f5ef", card: "#ffffff", text: "#1a1a1a", sub: "#888", accent: "#2d5a27", accentBg: "rgba(45,90,39,0.06)", border: "#e8e5de", header: "#ffffff", nav: "#ffffff", shadow: "rgba(0,0,0,0.04)", verseNum: "#2d5a27" };

  // ── Navigation (tab state memory) ──
  const navigate = (target) => {
    const mainTabIds = ["home","bible","hymn","worship","tongdok","bookmarks"];
    const isMainTabTarget = mainTabIds.includes(target);
    if (isMainTabTarget && target !== mainTab) {
      tabStateRef.current[mainTab] = { screen, hymnCategory, bookmarkTab };
    }
    if (target === "home") { setMainTab("home"); setScreen("home"); }
    else if (target === "bible") {
      setMainTab("bible");
      const saved = (target !== mainTab) ? tabStateRef.current.bible : null;
      if (saved) { setScreen(saved.screen); }
      else { setScreen("books"); }
    }
    else if (target === "hymn") {
      setMainTab("hymn");
      const saved = (target !== mainTab) ? tabStateRef.current.hymn : null;
      if (saved) {
        setScreen(saved.screen);
        if (saved.hymnCategory !== undefined) setHymnCategory(saved.hymnCategory);
        if (saved.hymnCategory === "ghymn" && gHymnIndex.length === 0) loadGHymnIndex().then(setGHymnIndex);
        if (saved.hymnCategory === "khymn" && kHymnIndex.length === 0) loadKHymnIndex().then(setKHymnIndex);
      } else {
        setScreen("hymnCategory"); setSelectedHymn(null); setHymnLyrics(null); setHymnCategory(null);
      }
    }
    else if (target === "hymnCategoryBack") { setScreen("hymnCategory"); setHymnCategory(null); }
    else if (target === "hymnListBack") { setScreen("hymnList"); }
    else if (target === "worship") {
      setMainTab("worship");
      const saved = (target !== mainTab) ? tabStateRef.current.worship : null;
      if (saved) { setScreen(saved.screen); }
      else { setScreen("worship"); }
    }
    else if (target === "sermon") { setScreen("sermon"); }
    else if (target === "familyWorship") { setScreen("familyWorship"); }
    else if (target === "tongdok") { setMainTab("tongdok"); setScreen("tongdok"); setFromTongdok(false); }
    else if (target === "bookmarks") {
      setMainTab("bookmarks");
      const saved = (target !== mainTab) ? tabStateRef.current.bookmarks : null;
      if (saved?.bookmarkTab) setBookmarkTab(saved.bookmarkTab);
      setScreen("bookmarks");
    }
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

  // ── Bible Reading Progress ──
  const markChapterRead = useCallback((bookId, chapter) => {
    setBibleReads(prev => {
      const key = `${bookId}-${chapter}`;
      const currentCount = prev[key] || 0;
      // Calculate completed rounds (min reads across all chapters)
      let minCount = Infinity;
      for (const book of booksIndex) {
        for (let ch = 1; ch <= book.chapters; ch++) {
          const k = `${book.id}-${ch}`;
          const c = k === key ? currentCount : (prev[k] || 0);
          if (c < minCount) minCount = c;
        }
      }
      const completedRounds = (minCount === Infinity) ? 0 : minCount;
      const currentRound = completedRounds + 1;
      if (currentCount < currentRound) {
        return { ...prev, [key]: currentCount + 1 };
      }
      return prev;
    });
  }, [booksIndex]);

  // Completed full Bible rounds
  const completedBibleRounds = useMemo(() => {
    if (booksIndex.length === 0) return 0;
    let minCount = Infinity;
    for (const book of booksIndex) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        const count = bibleReads[`${book.id}-${ch}`] || 0;
        if (count < minCount) minCount = count;
      }
    }
    return minCount === Infinity ? 0 : minCount;
  }, [booksIndex, bibleReads]);

  const currentBibleRound = completedBibleRounds + 1;

  // Get read color for a chapter
  const getChapterReadColor = useCallback((bookId, chapter) => {
    const count = bibleReads[`${bookId}-${chapter}`] || 0;
    if (count === 0) return null;
    const colorIdx = Math.min(count - 1, readRoundColors.length - 1);
    return readRoundColors[colorIdx];
  }, [bibleReads]);

  // Get book completion info
  const getBookReadRounds = useCallback((bookId, totalChapters) => {
    let minCount = Infinity;
    for (let ch = 1; ch <= totalChapters; ch++) {
      const count = bibleReads[`${bookId}-${ch}`] || 0;
      if (count < minCount) minCount = count;
    }
    return minCount === Infinity ? 0 : minCount;
  }, [bibleReads]);

  // Get testament completion
  const getTestamentRounds = useCallback((testamentType) => {
    const books = booksIndex.filter(b => b.testament === testamentType);
    if (books.length === 0) return 0;
    let minCount = Infinity;
    for (const book of books) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        const count = bibleReads[`${book.id}-${ch}`] || 0;
        if (count < minCount) minCount = count;
      }
    }
    return minCount === Infinity ? 0 : minCount;
  }, [booksIndex, bibleReads]);

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
  // Preload voices on first interaction
  useEffect(() => {
    const init = () => { if (window.speechSynthesis) window.speechSynthesis.getVoices(); };
    document.addEventListener('touchstart', init, { once: true, passive: true });
    document.addEventListener('click', init, { once: true });
    return () => { document.removeEventListener('touchstart', init); document.removeEventListener('click', init); };
  }, []);

  const ttsStop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setTtsPlaying(false); setTtsPaused(false); setTtsVerse(-1);
  }, []);

  const ttsSpeak = useCallback((texts, startIdx = 0, verseMap = null, langMap = null) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      setTtsError('이 브라우저에서는 읽어주기를 지원하지 않습니다. Chrome 앱을 사용해 주세요.');
      return;
    }
    try {
      // Refresh voices (Chrome Android loads async)
      const fresh = synth.getVoices();
      if (fresh.length) voicesRef.current = fresh;
      ttsTextsRef.current = texts;
      if (verseMap !== null) ttsVerseMapRef.current = verseMap;
      if (langMap !== null) ttsLangMapRef.current = langMap;
      if (startIdx >= texts.length) { ttsStop(); return; }
      setTtsError('');
      setTtsPlaying(true); setTtsPaused(false);
      ttsIdxRef.current = startIdx;
      const vm = ttsVerseMapRef.current;
      setTtsVerse(vm ? vm[startIdx] : startIdx);
      const utter = new SpeechSynthesisUtterance(texts[startIdx]);
      const lm = ttsLangMapRef.current;
      const lang = lm ? lm[startIdx] : 'ko-KR';
      utter.lang = lang;
      try { const voice = getPreferredVoice(lang); if (voice) { utter.voice = voice; utter.lang = voice.lang; } } catch(_) {}
      utter.rate = ttsSpeedRef.current;
      utter.onend = () => { if (startIdx + 1 < texts.length) ttsSpeak(texts, startIdx + 1); else ttsStop(); };
      utter.onerror = (ev) => {
        if (ev.error !== 'canceled' && ev.error !== 'interrupted') {
          // voice 지정 실패 시 lang만으로 재시도 (삼성 인터넷 등)
          if (utter.voice) {
            const retry = new SpeechSynthesisUtterance(texts[startIdx]);
            retry.lang = lang;
            retry.rate = ttsSpeedRef.current;
            retry.onend = () => { if (startIdx + 1 < texts.length) ttsSpeak(texts, startIdx + 1); else ttsStop(); };
            retry.onerror = (e2) => { if (e2.error !== 'canceled' && e2.error !== 'interrupted') ttsStop(); };
            synth.speak(retry);
          } else { ttsStop(); }
        }
      };
      // Clear any stale state before speaking (no resume() - causes silent failure on Android Chrome)
      synth.cancel();
      synth.speak(utter);
    } catch (e) {
      setTtsError('읽어주기 오류: ' + e.message);
      ttsStop();
    }
  }, [ttsStop]);

  // Debounced TTS trigger (handles both onClick and onTouchEnd to ensure mobile works)
  const triggerTts = useCallback((getTtsDataFn) => {
    const now = Date.now();
    if (now - ttsClickTimeRef.current < 400) return;
    ttsClickTimeRef.current = now;
    const d = getTtsDataFn();
    ttsSpeak(d.texts, 0, d.verseMap, d.langMap);
  }, [ttsSpeak]);

  const ttsTogglePause = useCallback(() => {
    if (!window.speechSynthesis) return;
    if (ttsPaused) {
      // Android Chrome에서 resume() 안 됨 → 현재 위치부터 다시 speak
      window.speechSynthesis.cancel();
      setTtsPaused(false);
      ttsSpeak(ttsTextsRef.current, ttsIdxRef.current);
    } else {
      window.speechSynthesis.cancel();
      setTtsPaused(true);
    }
  }, [ttsPaused, ttsSpeak]);

  // ── Search (bilingual) ──
  const doSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const q = query.trim().toLowerCase();
    const results = [];

    // Search hymns first (fast - from index)
    const hIndex = dataCache.hymnsIndex || [];
    hIndex.forEach(h => {
      const oldN = NEW2OLD[h.n];
      if (h.t.toLowerCase().includes(q) || h.n.toString() === q || (oldN && oldN.toString() === q)) {
        results.push({ type: "hymn", number: h.n, oldNumber: oldN, title: h.t, vid: h.v });
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
    const qNum = parseInt(q);
    return hymnsIndex.filter(h => {
      if (h.t.toLowerCase().includes(q) || h.n.toString().includes(q)) return true;
      if (!isNaN(qNum)) { const old = NEW2OLD[h.n]; if (old && old.toString().includes(q)) return true; }
      return false;
    });
  }, [hymnsIndex, hymnSearch]);

  // ══════════════════════════════════════
  // COMPONENTS
  // ══════════════════════════════════════

  // ── Shared Components ──
  const Header = ({ title, showBack, backTarget, right }) => {
    if (!showBack && !right) return null;
    return (
      <div style={{ background: t.bg, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
          {showBack && <button onClick={() => navigate(backTarget || "home")} style={{ background: "none", border: "none", fontSize: 24, color: t.accent, cursor: "pointer", padding: "2px 8px 2px 0", lineHeight: 1 }}>‹</button>}
          {showBack && <span style={{ fontSize: 17, fontWeight: 700, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>{right}</div>
      </div>
    );
  };

  const Pill = ({ active, label, onClick, small }) => (
    <button onClick={onClick} style={{ padding: small ? "6px 14px" : "8px 18px", borderRadius: 20, border: `1.5px solid ${active ? t.accent : t.border}`, background: active ? t.accentBg : "transparent", color: active ? t.accent : t.sub, fontWeight: active ? 600 : 400, fontSize: small ? 12 : 13, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  // ── HOME SEARCH HEADER (rendered outside HomeScreen to preserve input focus) ──
  const homeSearchTimeout = useRef(null);
  const HomeSearchHeader = () => (
    <div>
      <div style={{ padding: "12px 16px", background: t.bg, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ position: "relative" }}>
          <input
            ref={searchInputRef}
            type="text" placeholder="성경 구절, 찬송가 검색..." defaultValue={searchQuery}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" data-form-type="other"
            onChange={e => {
              const val = e.target.value;
              clearTimeout(homeSearchTimeout.current);
              homeSearchTimeout.current = setTimeout(() => {
                setSearchQuery(val);
                doSearch(val);
              }, 400);
            }}
            style={{ width: "100%", padding: "12px 14px 12px 38px", borderRadius: 10, border: `1.5px solid ${t.border}`, background: t.card, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", color: t.text }}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.35 }}>🔍</span>
        </div>
      </div>
      {searchQuery && (
        <div style={{ padding: "8px 16px", background: t.bg }}>
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
                  {r.type === "hymn" ? `${r.oldNumber ? r.oldNumber : r.number}장${r.oldNumber ? ` (새${r.number})` : ''} ${r.title}` : `${r.bookName} ${r.chapter}:${r.verse}`}
                </span>
              </div>
              {r.text && <p style={{ fontSize: 13, color: t.text, lineHeight: 1.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.text}</p>}
              {r.textEn && <p style={{ fontSize: 12, color: t.sub, lineHeight: 1.4, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>{r.textEn}</p>}
            </button>
          ))}
          {!searching && searchResults.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <p style={{ color: t.sub, fontSize: 13 }}>검색 결과가 없습니다</p>
            </div>
          )}
          {searchResults.length >= 100 && (
            <p style={{ textAlign: "center", color: t.sub, fontSize: 12, padding: "10px 0" }}>최대 100개 결과까지 표시됩니다</p>
          )}
        </div>
      )}
    </div>
  );

  // ── HOME SCREEN ──
  const HomeScreen = () => (
    <div style={{ paddingBottom: 90 }}>
      {/* Today's Verse */}
      {todayVerse && (
        <div onClick={() => { const book = booksIndex.find(b => b.id === todayVerse.bookId); if (book) { setSelectedBook(book); setSelectedChapter(todayVerse.ch); setMainTab("bible"); setScreen("reading"); }}} style={{ margin: "0 16px 16px", padding: "20px", background: darkMode ? "linear-gradient(135deg, #1b3a1a, #1a2e1a)" : "linear-gradient(135deg, #f5f0e6, #f2ede3)", borderRadius: 16, cursor: "pointer", border: `1px solid ${darkMode ? '#2a4a2a' : '#e0dbd0'}` }}>
          <div style={{ fontSize: 10, color: t.accent, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>TODAY'S VERSE</div>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: t.text, wordBreak: "keep-all" }}>"{todayVerse.text}"</p>
          <p style={{ fontSize: 12, color: t.accent, fontWeight: 600, marginTop: 10 }}>— {todayVerse.ref}</p>
        </div>
      )}

      {/* Recent Reading */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 10 }}>최근 읽은 성경 구절</h3>
        {readHistory.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {readHistory.slice(0, 3).map((h, i) => (
              <button key={i} onClick={() => { const book = booksIndex.find(b => b.id === h.bookId); if (book) { setSelectedBook(book); setSelectedChapter(h.chapter); setMainTab("bible"); setScreen("reading"); }}} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12, boxShadow: `0 1px 3px ${t.shadow}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{h.bookName} {h.chapter}장</div>
                  <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{h.date}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
            <div style={{ fontSize: 13, color: t.sub }}>성경을 읽으면 여기에 기록됩니다</div>
          </div>
        )}
      </div>

      {/* Recent Hymns */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 10 }}>최근 찬송가</h3>
        {hymnHistory.length > 0 ? (
          hymnHistory.slice(0, 3).map((h) => {
            const oldN = NEW2OLD[h.n];
            return (
            <button key={h.n} onClick={() => { setSelectedHymn(h); setMainTab("hymn"); setScreen("hymnDetail"); setSheetError(false); }} style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: oldN ? 10 : 13, fontWeight: 700, color: t.accent, flexShrink: 0, flexDirection: "column", lineHeight: 1.3 }}>{oldN ? <><span>{oldN}</span><span style={{ fontSize: 8, opacity: 0.6 }}>({h.n})</span></> : h.n}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{h.t}</div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{h.date}</div>
              </div>
            </button>);
          })
        ) : (
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "24px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.45 }}>🎵</div>
            <div style={{ fontSize: 13, color: t.sub }}>찬송가를 들으면 여기에 기록됩니다</div>
          </div>
        )}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: t.text }}>다크 모드</span>
            <button onClick={() => setDarkMode(!darkMode)} style={{ width: 48, height: 26, borderRadius: 13, border: "none", background: darkMode ? t.accent : t.border, cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: darkMode ? 25 : 3, transition: "all 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
          </div>
          {/* Reset */}
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
            <button onClick={() => setShowResetConfirm(true)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid #e74c3c40`, background: "transparent", cursor: "pointer", color: "#e74c3c", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
              데이터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowResetConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.card, borderRadius: 16, padding: "28px 24px", maxWidth: 340, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: t.text, margin: "0 0 8px" }}>정말 초기화하시겠습니까?</h3>
              <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.7, margin: 0 }}>
                초기화하면 아래 데이터가 모두 삭제되며<br/>복구할 수 없습니다.
              </p>
            </div>
            <div style={{ background: darkMode ? '#2a2020' : '#fdf5f5', borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#e74c3c", lineHeight: 1.8 }}>
                • 최근 읽은 성경 구절<br/>
                • 최근 찬송가<br/>
                • 북마크 / 형광펜 / 메모<br/>
                • 통독 플랜 진행 상황
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: "13px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", color: t.text, fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
                취소
              </button>
              <button onClick={() => {
                setReadHistory([]);
                setHymnHistory([]);
                setBookmarks([]);
                setHighlights({});
                setMemos({});
                setBiblePlan(null);
                setBibleReads({});
                setShowResetConfirm(false);
              }} style={{ flex: 1, padding: "13px", borderRadius: 10, border: "none", background: "#e74c3c", cursor: "pointer", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── BIBLE BOOKS SCREEN ──
  const BooksScreen = () => {
    const books = booksIndex.filter(b => testament === "old" ? b.testament === "old" : b.testament === "new");
    const otRounds = getTestamentRounds("old");
    const ntRounds = getTestamentRounds("new");
    const otLabel = otRounds > 0 ? `구약 (39) ✓${otRounds}독` : "구약 (39)";
    const ntLabel = ntRounds > 0 ? `신약 (27) ✓${ntRounds}독` : "신약 (27)";

    return (
      <div style={{ paddingBottom: 90 }}>
        {/* Bible completion banner */}
        {completedBibleRounds > 0 && (
          <div style={{ margin: "12px 16px 0", padding: "12px 16px", borderRadius: 10, background: darkMode ? "linear-gradient(135deg, #1b3a1a, #1a2e1a)" : "linear-gradient(135deg, #f5f0e6, #f2ede3)", border: `1px solid ${darkMode ? '#2a4a2a' : '#e0dbd0'}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎉</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.accent }}>성경 {completedBibleRounds}독 완료!</div>
              <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>현재 {currentBibleRound}독 진행 중</div>
            </div>
          </div>
        )}
        <div style={{ padding: "12px 16px", display: "flex", gap: 8, position: "sticky", top: 0, background: t.bg, zIndex: 50, borderBottom: `1px solid ${t.border}` }}>
          <Pill active={testament === "old"} label={otLabel} onClick={() => setTestament("old")} />
          <Pill active={testament === "new"} label={ntLabel} onClick={() => setTestament("new")} />
        </div>
        <div style={{ padding: "12px 12px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {books.map(book => {
            const bookRounds = getBookReadRounds(book.id, book.chapters);
            const bookColor = bookRounds > 0 ? readRoundColors[Math.min(bookRounds - 1, readRoundColors.length - 1)] : null;
            return (
              <button key={book.id} onClick={() => { setSelectedBook(book); setScreen("chapters"); }} style={{ padding: "12px 4px", borderRadius: 10, border: `1px solid ${bookColor ? bookColor.border : t.border}`, background: bookColor ? bookColor.bg : t.card, cursor: "pointer", textAlign: "center", boxShadow: `0 1px 2px ${t.shadow}`, position: "relative" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{book.shortName}</div>
                <div style={{ fontSize: 10, color: t.sub, marginTop: 2 }}>{book.chapters}장</div>
                {bookRounds > 0 && (
                  <div style={{ position: "absolute", top: 2, right: 2, fontSize: 8, fontWeight: 700, color: bookColor.border, background: darkMode ? '#1e1e1e' : '#fff', borderRadius: 4, padding: "1px 4px", lineHeight: 1.3 }}>{bookRounds}독</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── CHAPTERS SCREEN ──
  const ChaptersScreen = () => {
    if (!selectedBook) return null;
    const bookRounds = getBookReadRounds(selectedBook.id, selectedBook.chapters);
    // Count read chapters in current round
    let readInCurrentRound = 0;
    for (let ch = 1; ch <= selectedBook.chapters; ch++) {
      const count = bibleReads[`${selectedBook.id}-${ch}`] || 0;
      if (count >= currentBibleRound) readInCurrentRound++;
    }
    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "18px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: 0 }}>{selectedBook.name}</h2>
            {bookRounds > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: readRoundColors[Math.min(bookRounds - 1, readRoundColors.length - 1)].border, background: readRoundColors[Math.min(bookRounds - 1, readRoundColors.length - 1)].bg, padding: "2px 8px", borderRadius: 6 }}>{bookRounds}독 완료</span>
            )}
          </div>
          <p style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{selectedBook.nameEn} · {selectedBook.chapters}장 · {readInCurrentRound}/{selectedBook.chapters} 읽음</p>
        </div>
        <div style={{ padding: "4px 12px 16px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
          {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => {
            const chColor = getChapterReadColor(selectedBook.id, ch);
            return (
              <button key={ch} onClick={() => { setSelectedChapter(ch); setScreen("reading"); }} style={{ padding: "12px 0", borderRadius: 10, border: `1px solid ${chColor ? chColor.border : t.border}`, background: chColor ? chColor.bg : t.card, cursor: "pointer", fontSize: 15, fontWeight: 500, color: t.text, fontFamily: "inherit", boxShadow: `0 1px 2px ${t.shadow}` }}>
                {ch}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── VERSE ACTION MENU (highlight + memo + copy) ──
  const VerseActionMenu = ({ bKey, verseText, verseRef }) => {
    const [memoText, setMemoText] = useState(memos[bKey] || '');
    const [showMemoEditor, setShowMemoEditor] = useState(false);
    const [copyDone, setCopyDone] = useState(false);

    const handleCopy = async (e) => {
      e.stopPropagation();
      const text = `${verseRef}\n${verseText}`;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1500);
    };

    return (
      <div style={{ padding: "10px 12px", background: darkMode ? '#2a2a2a' : '#fafaf5', border: `1px solid ${t.border}`, borderRadius: 10, marginTop: 6 }}>
        {/* Copy button */}
        <div style={{ marginBottom: 8 }}>
          <button onClick={handleCopy} style={{ fontSize: 12, color: copyDone ? '#4CAF50' : t.accent, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
            {copyDone ? '✓ 복사됨' : '📋 구절 복사'}
          </button>
        </div>
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
    const langLabel = bibleLang === 'ko' ? '개역한글' : bibleLang === 'en' ? 'NIV' : '개역한글/NIV';

    // Get TTS data based on language (texts + verse mapping + language mapping)
    const getTtsData = () => {
      if (!verses) return { texts: [], verseMap: [], langMap: [] };
      const texts = [], verseMap = [], langMap = [];
      if (bibleLang === 'ko') {
        verses.forEach((v, i) => {
          if (v.ko) { texts.push(v.ko); verseMap.push(i); langMap.push('ko-KR'); }
        });
      } else if (bibleLang === 'en') {
        verses.forEach((v, i) => {
          if (v.en) { texts.push(v.en); verseMap.push(i); langMap.push('en-US'); }
        });
      } else {
        // both: Korean then English per verse
        verses.forEach((v, i) => {
          if (v.ko) { texts.push(v.ko); verseMap.push(i); langMap.push('ko-KR'); }
          if (v.en) { texts.push(v.en); verseMap.push(i); langMap.push('en-US'); }
        });
      }
      return { texts, verseMap, langMap };
    };

    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${t.border}` }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{bookName} {selectedChapter}장 <span style={{ fontSize: 13, fontWeight: 500, color: t.sub }}>({selectedChapter}/{selectedBook.chapters})</span></h2>
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
            {ttsError && <p style={{ width: "100%", margin: 0, fontSize: 11, color: "#e53935" }}>{ttsError}</p>}
            {!ttsPlaying ? (
              <button onClick={() => triggerTts(getTtsData)} onTouchEnd={(e) => { e.preventDefault(); triggerTts(getTtsData); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 16px", borderRadius: 20, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
                ▶ 읽어주기
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={ttsTogglePause} onTouchEnd={(e) => { e.preventDefault(); ttsTogglePause(); }} style={{ padding: "7px 14px", borderRadius: 20, border: "none", background: t.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
                  {ttsPaused ? "▶ 계속" : "⏸ 일시정지"}
                </button>
                <button onClick={ttsStop} onTouchEnd={(e) => { e.preventDefault(); ttsStop(); }} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${t.accent}`, background: "transparent", color: t.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
                  ■ 정지
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
              {[0.7, 1.0, 1.3].map(spd => {
                const spdHandler = () => { setTtsSpeed(spd); ttsSpeedRef.current = spd; if (ttsPlaying) { ttsSpeak(ttsTextsRef.current, ttsIdxRef.current); } };
                return <button key={spd} onClick={spdHandler} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${ttsSpeed === spd ? t.accent : t.border}`, background: ttsSpeed === spd ? t.accentBg : "transparent", color: ttsSpeed === spd ? t.accent : t.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
                  {spd === 0.7 ? "느림" : spd === 1.0 ? "보통" : "빠름"}
                </button>;
              })}
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
                <div key={i} style={{ display: "flex", gap: 0, marginBottom: 2, padding: "8px 8px", borderRadius: 8, background: isReading ? `${t.accent}18` : "transparent", transition: "background 0.3s", borderLeft: isReading ? `3px solid ${t.accent}` : "3px solid transparent" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.verseNum, minWidth: 28, paddingTop: 5, opacity: 0.7, flexShrink: 0 }}>{vNum}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Korean text */}
                    {verseObj.ko && (
                      <p onClick={() => { if (!ttsPlaying) setActiveVerseMenu(isMenuOpen ? null : bKey); else { const vm = ttsVerseMapRef.current; let idx = i; if (vm) { idx = vm.indexOf(i); if (idx === -1) idx = i; } ttsSpeak(ttsTextsRef.current, idx); } }}
                        style={{ fontSize, lineHeight: 1.85, margin: 0, wordBreak: "keep-all", color: t.text, cursor: "pointer" }}>
                        {hlColor ? <span style={{ background: highlightBgMap[hlColor], borderRadius: 3, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone", padding: "2px 0" }}>{verseObj.ko}</span> : verseObj.ko}
                      </p>
                    )}
                    {/* English text */}
                    {verseObj.en && (
                      <p onClick={() => { if (!ttsPlaying) setActiveVerseMenu(isMenuOpen ? null : bKey); else { const vm = ttsVerseMapRef.current; let idx = i; if (vm) { idx = vm.indexOf(i); if (idx === -1) idx = i; } ttsSpeak(ttsTextsRef.current, idx); } }}
                        style={{ fontSize: bibleLang === 'both' ? fontSize - 1 : fontSize, lineHeight: 1.75, margin: bibleLang === 'both' ? "4px 0 0" : 0, wordBreak: "break-word", color: bibleLang === 'both' ? t.sub : t.text, fontStyle: bibleLang === 'both' ? "italic" : "normal", cursor: "pointer" }}>
                        {hlColor ? <span style={{ background: highlightBgMap[hlColor], borderRadius: 3, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone", padding: "2px 0" }}>{verseObj.en}</span> : verseObj.en}
                      </p>
                    )}
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleBookmark("verse", { key: bKey, bookId: selectedBook.id, bookName: selectedBook.name, chapter: selectedChapter, verse: vNum, text: verseObj.ko || verseObj.en || '' }); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", padding: 0, opacity: isBookmarked(bKey) ? 0.9 : 0.35, color: isBookmarked(bKey) ? undefined : t.sub }}>
                        {isBookmarked(bKey) ? "✨" : "✧"}
                      </button>
                      {hasMemo && <span style={{ fontSize: 11, opacity: 0.6 }}>📝</span>}
                      <button onClick={(e) => { e.stopPropagation(); setActiveVerseMenu(isMenuOpen ? null : bKey); }} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: t.sub, padding: 0, opacity: 0.5 }}>
                        ⋯
                      </button>
                    </div>
                    {/* Verse action menu */}
                    {isMenuOpen && <VerseActionMenu bKey={bKey} verseText={[verseObj.ko, verseObj.en].filter(Boolean).join('\n')} verseRef={`${selectedBook.name} ${selectedChapter}:${vNum}`} />}
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
        {fromTongdok ? (
          <div style={{ padding: "12px 16px 20px", borderTop: `1px solid ${t.border}` }}>
            <button onClick={() => {
              const key = `${selectedBook.id}-${selectedChapter}`;
              setBiblePlan(prev => {
                if (!prev) return prev;
                const set = new Set(prev.completed);
                set.add(key);
                return { ...prev, completed: [...set] };
              });
              markChapterRead(selectedBook.id, selectedChapter);
              ttsStop();
              setFromTongdok(false);
              setScreen("tongdok");
            }} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: t.accent, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ✓ 읽음 완료
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 20px", borderTop: `1px solid ${t.border}`, gap: 8 }}>
            <button disabled={selectedChapter <= 1} onClick={() => { ttsStop(); setSelectedChapter(c => c - 1); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: selectedChapter > 1 ? "pointer" : "default", color: t.text, fontFamily: "inherit", fontSize: 14, fontWeight: 600, opacity: selectedChapter <= 1 ? 0.3 : 1 }}>‹ 이전</button>
            <button onClick={() => { markChapterRead(selectedBook.id, selectedChapter); ttsStop(); if (selectedChapter < selectedBook.chapters) setSelectedChapter(c => c + 1); }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: t.accent, cursor: "pointer", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>✓ 읽음</button>
            <button disabled={selectedChapter >= selectedBook.chapters} onClick={() => { ttsStop(); setSelectedChapter(c => c + 1); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: selectedChapter < selectedBook.chapters ? "pointer" : "default", color: t.text, fontFamily: "inherit", fontSize: 14, fontWeight: 600, opacity: selectedChapter >= selectedBook.chapters ? 0.3 : 1 }}>다음 ›</button>
          </div>
        )}
      </div>
    );
  };

  // ── HYMN LIST SCREEN ──
  const [hymnRange, setHymnRange] = useState("all");
  const [hymnShowCount, setHymnShowCount] = useState(50);

  // Reset show count when filter changes
  useEffect(() => { setHymnShowCount(50); }, [hymnSearch, hymnRange]);

  const rangeFilteredHymns = useMemo(() => {
    let list = [...filteredHymns].sort((a, b) => { const oa = NEW2OLD[a.n] || 9999; const ob = NEW2OLD[b.n] || 9999; return oa === ob ? a.n - b.n : oa - ob; });
    if (hymnRange !== "all" && !hymnSearch.trim()) {
      const [start, end] = hymnRange.split("-").map(Number);
      list = list.filter(h => { const d = NEW2OLD[h.n] || h.n; return d >= start && d <= end; });
    }
    return list;
  }, [filteredHymns, hymnRange, hymnSearch]);

  const HymnSearchHeader = () => (
    <div style={{ padding: "12px 16px", background: t.bg, borderBottom: `1px solid ${t.border}` }}>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          ref={hymnSearchInputRef}
          type="text" placeholder={`${hymnCategory === "ghymn" ? "은혜와진리찬양" : hymnCategory === "khymn" ? "어린이 찬송가" : "찬송가"} 검색 (번호 또는 제목)`} defaultValue={hymnSearch}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" data-form-type="other"
          onChange={e => {
            const val = e.target.value;
            clearTimeout(hymnSearchTimeout.current);
            hymnSearchTimeout.current = setTimeout(() => setHymnSearch(val), 300);
          }}
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
            { id: "401-558", label: "401~558" },
          ].map(r => (
            <Pill key={r.id} active={hymnRange === r.id} label={r.label} onClick={() => setHymnRange(r.id)} small />
          ))}
        </div>
      )}
    </div>
  );

  // ── HYMN CATEGORY SCREEN ──
  const HymnCategoryScreen = () => {
    const categories = [
      { id: "hymn", icon: "🎵", label: "찬송가", color: t.accent },
      { id: "ghymn", icon: "🙏", label: "은혜와진리찬양", color: "#7b1fa2" },
      { id: "khymn", icon: "🧒", label: "어린이 찬송가", color: "#e67e22" },
      { id: "choir", icon: "🎶", label: "성가대찬양", color: "#1976d2" },
    ];
    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "24px 16px" }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => {
              if (cat.id === "choir") {
                setHymnCategory("choir");
                setScreen("choirScreen");
                return;
              }
              setHymnCategory(cat.id);
              setHymnSearch("");
              setHymnShowCount(50);
              setHymnRange("all");
              if (cat.id === "ghymn") loadGHymnIndex().then(setGHymnIndex);
              else if (cat.id === "khymn") loadKHymnIndex().then(setKHymnIndex);
              setScreen("hymnList");
            }} style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${cat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{cat.label}</div>
              </div>
              <div style={{ fontSize: 18, color: t.sub }}>›</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Get current hymn list based on category
  const currentHymnList = useMemo(() => {
    if (hymnCategory === "ghymn") return gHymnIndex;
    if (hymnCategory === "khymn") return kHymnIndex;
    return hymnsIndex;
  }, [hymnCategory, hymnsIndex, gHymnIndex, kHymnIndex]);

  const filteredCurrentHymns = useMemo(() => {
    if (!hymnSearch.trim()) return currentHymnList;
    const q = hymnSearch.trim().toLowerCase();
    const qNum = parseInt(q);
    return currentHymnList.filter(h => {
      if (h.t.toLowerCase().includes(q) || h.n.toString().includes(q)) return true;
      if (hymnCategory === "hymn" && !isNaN(qNum)) { const old = NEW2OLD[h.n]; if (old && old.toString().includes(q)) return true; }
      return false;
    });
  }, [currentHymnList, hymnSearch, hymnCategory]);

  const rangeFilteredCurrentHymns = useMemo(() => {
    let list = hymnCategory === "hymn" ? rangeFilteredHymns : filteredCurrentHymns;
    if (hymnCategory !== "hymn" && hymnRange !== "all" && !hymnSearch.trim()) {
      const [start, end] = hymnRange.split("-").map(Number);
      list = filteredCurrentHymns.filter(h => h.n >= start && h.n <= end);
    }
    return list;
  }, [hymnCategory, rangeFilteredHymns, filteredCurrentHymns, hymnRange, hymnSearch]);

  const HymnListScreen = () => {
    const list = hymnCategory === "hymn" ? rangeFilteredHymns : rangeFilteredCurrentHymns;
    const catLabel = hymnCategory === "ghymn" ? "은혜와진리찬양" : hymnCategory === "khymn" ? "어린이 찬송가" : "찬송가";
    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "8px 16px" }}>
          <p style={{ fontSize: 11, color: t.sub, marginBottom: 8 }}>{catLabel} ({list.length}곡)</p>
          {list.slice(0, hymnShowCount).map((h) => {
            const oldNum = hymnCategory === "hymn" ? NEW2OLD[h.n] : null;
            return (
            <button key={h.n} onClick={() => {
              setSelectedHymn(h); setScreen("hymnDetail"); setSheetError(false); setHymnViewMode(hymnCategory === "ghymn" || hymnCategory === "khymn" ? "sheet" : "lyrics");
            }} style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 5, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
              <div style={{ minWidth: 38, height: 38, borderRadius: 8, background: hymnCategory === "ghymn" ? "rgba(123,31,162,0.1)" : hymnCategory === "khymn" ? "rgba(230,126,34,0.1)" : t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: oldNum ? 11 : 13, fontWeight: 700, color: hymnCategory === "ghymn" ? "#7b1fa2" : hymnCategory === "khymn" ? "#e67e22" : t.accent, flexShrink: 0, padding: "0 4px", flexDirection: "column", lineHeight: 1.3 }}>
                {oldNum ? <><span>{oldNum}</span><span style={{ fontSize: 9, opacity: 0.6 }}>({h.n})</span></> : h.n}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.t}</div>
              </div>
              {h.v && <span style={{ fontSize: 14, color: t.sub, flexShrink: 0 }}>▶</span>}
            </button>);
          })}
          {hymnShowCount < list.length && (
            <button onClick={() => setHymnShowCount(c => c + 50)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", color: t.accent, fontSize: 13, fontWeight: 600, fontFamily: "inherit", marginTop: 4 }}>
              더 보기 ({list.length - hymnShowCount}곡 남음)
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── HYMN DETAIL SCREEN ──
  const HymnDetailScreen = () => {
    if (!selectedHymn) return null;
    const bKey = `hymn-${hymnCategory || 'hymn'}-${selectedHymn.n}`;
    const isRegularHymn = (hymnCategory === "hymn" || !hymnCategory);
    const lyrics = hymnLyrics?.lyrics || "";
    const lyricsLines = lyrics.split("\n");
    const oldNum2 = isRegularHymn ? NEW2OLD[selectedHymn.n] : null;
    const oldFileNum = oldNum2 ? (OLD2FILE[oldNum2] || oldNum2) : null;
    const oldIs2Page = oldNum2 && OLD_2PAGE.has(oldNum2);
    const sheetUrl = isRegularHymn ? (oldFileNum ? `https://choir.gntc.net/SNAS_MCIC/DATA/hymn/images/${oldFileNum}.png` : `/data/hymns/sheets/${String(selectedHymn.n).padStart(3, '0')}.jpg`)
      : hymnCategory === "ghymn" && selectedHymn.f ? `https://choir.gntc.net/SNAS_MCIC/DATA/gHymn/images/${selectedHymn.f}.png`
      : hymnCategory === "khymn" && selectedHymn.f ? `https://choir.gntc.net/SNAS_MCIC/DATA/kHymn/images/${selectedHymn.f}.png` : null;
    const sheetUrl2 = (!isRegularHymn && selectedHymn.s === 1 && selectedHymn.f)
      ? (hymnCategory === "ghymn" ? `https://choir.gntc.net/SNAS_MCIC/DATA/gHymn/images/${selectedHymn.f + 1}.png`
        : hymnCategory === "khymn" ? `https://choir.gntc.net/SNAS_MCIC/DATA/kHymn/images/${selectedHymn.f + 1}.png` : null)
      : null;
    const catLabel = hymnCategory === "ghymn" ? "은혜와진리찬양" : hymnCategory === "khymn" ? "어린이 찬송가" : "찬송가";
    const catColor = hymnCategory === "ghymn" ? "#7b1fa2" : hymnCategory === "khymn" ? "#e67e22" : t.accent;
    const oldNum = isRegularHymn ? NEW2OLD[selectedHymn.n] : null;
    const displayNum = oldNum || selectedHymn.n;
    const subLabel = isRegularHymn ? (oldNum ? `통일찬송가 ${oldNum}장 (새찬송가 ${selectedHymn.n}장)` : `새찬송가 ${selectedHymn.n}장`) : `${catLabel} ${selectedHymn.n}장`;
    // Audio URL: choir.gntc.net audio files are 1:1 with hymn numbers (1-558.mp3), no offset
    const audioUrl = isRegularHymn && oldNum2 ? `https://choir.gntc.net/SNAS_MCIC/DATA/hymn/ar/${oldNum2}.mp3`
      : hymnCategory === "ghymn" ? `https://choir.gntc.net/SNAS_MCIC/DATA/gHymn/ar/${selectedHymn.n}.mp3`
      : hymnCategory === "khymn" && selectedHymn.f ? `https://choir.gntc.net/SNAS_MCIC/DATA/kHymn/ar/${selectedHymn.f}.mp3` : null;

    return (
      <div style={{ paddingBottom: 90 }}>
        {/* Header info */}
        <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${catColor}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: oldNum ? 14 : 18, fontWeight: 700, color: catColor, flexDirection: "column", lineHeight: 1.3 }}>
              {oldNum ? <><span>{oldNum}</span><span style={{ fontSize: 10, opacity: 0.6 }}>({selectedHymn.n})</span></> : selectedHymn.n}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: 0 }}>{selectedHymn.t}</h2>
              <p style={{ fontSize: 12, color: t.sub, margin: "2px 0 0" }}>{subLabel}</p>
            </div>
            {/* Bookmark - star */}
            <button onClick={() => toggleBookmark("hymn", { key: bKey, title: selectedHymn.t, number: selectedHymn.n, text: selectedHymn.t })} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "4px", opacity: isBookmarked(bKey) ? 1 : 0.4, color: isBookmarked(bKey) ? undefined : t.sub }}>
              {isBookmarked(bKey) ? "✨" : "✧"}
            </button>
          </div>

          {/* View mode tabs + Audio */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {isRegularHymn && <Pill active={hymnViewMode === 'lyrics'} label="가사" onClick={() => setHymnViewMode('lyrics')} small />}
            {isRegularHymn && <Pill active={hymnViewMode === 'sheet'} label="악보" onClick={() => { setHymnViewMode('sheet'); setSheetError(false); }} small />}
          </div>
          {audioUrl ? (
            <audio controls preload="none" style={{ width: "100%", height: 36, marginTop: 8 }}>
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
          ) : selectedHymn.v ? (
            <button onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedHymn.v}`, '_blank')} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, padding: "8px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", color: t.text, fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
              ▶ YouTube에서 듣기
            </button>
          ) : null}
        </div>

        {/* Content area */}
        {!isRegularHymn && sheetUrl ? (
          /* Sheet music view (ghymn/khymn - always show directly, supports multi-page) */
          <div style={{ padding: "16px", textAlign: "center" }}>
            {!sheetError ? (
              <>
                <img
                  src={sheetUrl}
                  alt={`${selectedHymn.t} 악보`}
                  onError={() => setSheetError(true)}
                  style={{ maxWidth: "100%", borderRadius: 8, boxShadow: `0 2px 8px ${t.shadow}` }}
                  loading="lazy"
                />
                {sheetUrl2 && (
                  <img
                    src={sheetUrl2}
                    alt={`${selectedHymn.t} 악보 2`}
                    style={{ maxWidth: "100%", borderRadius: 8, boxShadow: `0 2px 8px ${t.shadow}`, marginTop: 8 }}
                    loading="lazy"
                  />
                )}
              </>
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.15 }}>🎵</div>
                <p style={{ color: t.sub, fontSize: 13 }}>악보를 불러올 수 없습니다</p>
              </div>
            )}
          </div>
        ) : isRegularHymn && hymnViewMode === 'sheet' && sheetUrl ? (
          /* Sheet music view (regular hymns - via button) */
          <div style={{ padding: "0 16px 16px", textAlign: "center" }}>
            {!sheetError ? (
              <>
                <img
                  src={sheetUrl}
                  alt={`${selectedHymn.t} 악보`}
                  onError={() => setSheetError(true)}
                  style={{ maxWidth: "100%", borderRadius: 8, boxShadow: `0 2px 8px ${t.shadow}`, imageRendering: "-webkit-optimize-contrast", filter: oldFileNum ? "none" : "contrast(1.3) brightness(1.05)" }}
                  loading="lazy"
                />
                {oldIs2Page && oldFileNum && (
                  <img
                    src={`https://choir.gntc.net/SNAS_MCIC/DATA/hymn/images/${oldFileNum + 1}.png`}
                    alt={`${selectedHymn.t} 악보 2`}
                    style={{ maxWidth: "100%", borderRadius: 8, boxShadow: `0 2px 8px ${t.shadow}`, marginTop: 8, imageRendering: "-webkit-optimize-contrast" }}
                    loading="lazy"
                  />
                )}
              </>
            ) : (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.15 }}>🎵</div>
                <p style={{ color: t.sub, fontSize: 13 }}>악보를 불러올 수 없습니다</p>
              </div>
            )}
          </div>
        ) : isRegularHymn ? (
          /* Lyrics view (regular hymns) */
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
        ) : null}
      </div>
    );
  };

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
                <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>✧</div>
                <p style={{ color: t.sub, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>저장된 항목이 없습니다</p>
                <p style={{ color: t.sub, fontSize: 12 }}>성경이나 찬송가에서 ✧를 눌러 저장하세요</p>
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
                        {b.type === "hymn" ? `${NEW2OLD[b.number] || b.number}장${NEW2OLD[b.number] ? ` (새${b.number})` : ''} ${b.title}` : `${b.bookName} ${b.chapter}:${b.verse}`}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: t.sub }}>{b.date}</span>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: t.text, margin: 0 }}>{b.text?.substring(0, 80)}{b.text?.length > 80 ? "..." : ""}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <button onClick={() => {
                      if (b.type === "hymn") {
                        const h = hymnsIndex.find(x => x.n === b.number);
                        if (h) { setSelectedHymn(h); setMainTab("hymn"); setScreen("hymnDetail"); setSheetError(false); }
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

  // ── TONGDOK SCREEN (통독) ──
  const TongdokScreen = () => {
    // Build flat chapter list from booksIndex
    const allChapters = useMemo(() => {
      const list = [];
      booksIndex.forEach(book => {
        for (let ch = 1; ch <= book.chapters; ch++) {
          list.push({ bookId: book.id, bookName: book.name, chapter: ch });
        }
      });
      return list;
    }, [booksIndex]);

    const totalChapters = allChapters.length; // 1189

    const planDays = { '1year': 365, '6month': 180, '3month': 90 };
    const planLabels = { '1year': '1년', '6month': '6개월', '3month': '3개월' };

    const getLocalDateStr = () => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    };

    const parseLocalDate = (str) => {
      const parts = str.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
    };

    const startPlan = (type) => {
      setBiblePlan({ plan: type, startDate: getLocalDateStr(), completed: [] });
    };

    const resetPlan = () => { if (confirm('통독 플랜을 초기화하시겠습니까?')) setBiblePlan(null); };

    // Get reading assignment for a given day offset (0=today, 1=tomorrow, ...)
    const getAssignment = (offset) => {
      if (!biblePlan || totalChapters === 0) return [];
      const days = biblePlan.plan === 'custom' ? biblePlan.totalDays : planDays[biblePlan.plan];
      if (!days || days <= 0) return [];
      const start = parseLocalDate(biblePlan.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayIndex = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + offset;
      if (dayIndex < 0 || dayIndex >= days) return [];
      const perDay = totalChapters / days;
      const startIdx = Math.floor(dayIndex * perDay);
      const endIdx = Math.floor((dayIndex + 1) * perDay);
      return allChapters.slice(startIdx, endIdx);
    };

    const todayAssignment = getAssignment(0);
    const tomorrowAssignment = getAssignment(1);
    const dayAfterAssignment = getAssignment(2);
    const completedSet = new Set(biblePlan?.completed || []);
    const completedCount = completedSet.size;
    const progress = totalChapters > 0 ? (completedCount / totalChapters * 100) : 0;

    const toggleComplete = (key) => {
      setBiblePlan(prev => {
        const set = new Set(prev.completed);
        const wasComplete = set.has(key);
        if (wasComplete) set.delete(key); else set.add(key);
        // Also mark as read in bible progress when completing
        if (!wasComplete) {
          const [bookId, ch] = key.split('-');
          markChapterRead(bookId, parseInt(ch));
        }
        return { ...prev, completed: [...set] };
      });
    };

    const goToChapter = (bookId, chapter) => {
      const book = booksIndex.find(b => b.id === bookId);
      if (book) {
        setSelectedBook(book);
        setSelectedChapter(chapter);
        setFromTongdok(true);
        setScreen("reading");
      }
    };

    // Custom plan handler
    const [customEndDate, setCustomEndDate] = useState('');
    const startCustomPlan = () => {
      if (!customEndDate) return;
      const todayLocal = getLocalDateStr();
      const startD = parseLocalDate(todayLocal);
      const endD = parseLocalDate(customEndDate);
      const diffDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return;
      setBiblePlan({ plan: 'custom', startDate: todayLocal, endDate: customEndDate, totalDays: diffDays, completed: [] });
    };

    // Plan selection
    if (!biblePlan) {
      return (
        <div style={{ paddingBottom: 90 }}>
          <div style={{ padding: "24px 16px" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>성경 통독 플랜</p>
            <p style={{ fontSize: 12, color: t.sub, marginBottom: 20 }}>목표 기간을 선택하면 매일 읽을 분량이 자동으로 배정됩니다</p>
            {[
              { type: '1year', label: '1년 플랜', desc: `하루 약 ${Math.ceil(1189 / 365)}장` },
              { type: '6month', label: '6개월 플랜', desc: `하루 약 ${Math.ceil(1189 / 180)}장` },
              { type: '3month', label: '3개월 플랜', desc: `하루 약 ${Math.ceil(1189 / 90)}장` },
            ].map(p => (
              <button key={p.type} onClick={() => startPlan(p.type)}
                style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📖</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{p.desc}</div>
                </div>
                <div style={{ fontSize: 18, color: t.sub }}>›</div>
              </button>
            ))}

            {/* Custom plan */}
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 16px", marginTop: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎯</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>나만의 플랜</div>
                  <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>목표 날짜를 직접 설정합니다</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
                  min={getLocalDateStr()}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, fontSize: 14, fontFamily: "inherit", color: t.text, boxSizing: "border-box" }} />
                <button onClick={startCustomPlan}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: customEndDate ? t.accent : t.border, color: customEndDate ? "#fff" : t.sub, fontSize: 14, fontWeight: 600, cursor: customEndDate ? "pointer" : "default", fontFamily: "inherit", flexShrink: 0 }}>
                  시작
                </button>
              </div>
              {customEndDate && (() => {
                const startD = parseLocalDate(getLocalDateStr());
                const endD = parseLocalDate(customEndDate);
                const diffDays = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24));
                if (diffDays <= 0) return null;
                return <p style={{ fontSize: 11, color: t.sub, marginTop: 8 }}>{diffDays}일간, 하루 약 {Math.ceil(1189 / diffDays)}장</p>;
              })()}
            </div>
          </div>
        </div>
      );
    }

    // Progress view
    const days = biblePlan.plan === 'custom' ? biblePlan.totalDays : planDays[biblePlan.plan];
    const start = parseLocalDate(biblePlan.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayIndex = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    // Check today's completion & encouragement
    const todayAllDone = todayAssignment.length > 0 && todayAssignment.every(item => completedSet.has(`${item.bookId}-${item.chapter}`));
    const tomorrowDone = tomorrowAssignment.length > 0 && tomorrowAssignment.every(item => completedSet.has(`${item.bookId}-${item.chapter}`));
    const tomorrowPartial = tomorrowAssignment.length > 0 && tomorrowAssignment.some(item => completedSet.has(`${item.bookId}-${item.chapter}`));
    const expectedByToday = totalChapters > 0 ? Math.floor((dayIndex + 1) * (totalChapters / days)) : 0;
    const getMessage = () => {
      if (dayIndex >= days && completedCount >= totalChapters) return { emoji: "🎉", text: "축하합니다! 성경 통독을 완료하셨습니다!", color: t.accent };
      if (dayIndex >= days) return { emoji: "📖", text: "통독 기간이 지났지만 아직 완주할 수 있습니다. 힘내세요!", color: "#e67e22" };
      if (todayAllDone && tomorrowDone) return { emoji: "🔥", text: "모레 분량까지 읽으셨네요! 정말 대단해요!", color: t.accent };
      if (todayAllDone && tomorrowPartial) return { emoji: "⭐", text: "내일 분량도 읽고 계시네요! 멋져요!", color: t.accent };
      if (todayAllDone) return { emoji: "🎉", text: "오늘 분량 완료! 여유가 되면 내일 분량도 도전해보세요!", color: t.accent };
      if (completedCount >= expectedByToday) return { emoji: "💪", text: "잘하고 있어요! 이 페이스 그대로 꾸준히!", color: t.accent };
      if (completedCount >= expectedByToday - 5) return { emoji: "📖", text: "조금만 더 하면 목표를 따라잡을 수 있어요!", color: "#e67e22" };
      return { emoji: "🏃", text: "조금 밀렸지만 괜찮아요! 오늘부터 다시 시작해요!", color: "#e67e22" };
    };
    const msg = getMessage();

    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "20px 16px" }}>
          {/* Encouragement message */}
          <div style={{ background: t.card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${t.border}`, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{msg.emoji}</span>
            <span style={{ fontSize: 13, color: msg.color, fontWeight: 500, lineHeight: 1.4 }}>{msg.text}</span>
          </div>

          {/* Summary */}
          <div style={{ background: t.card, borderRadius: 12, padding: "16px", border: `1px solid ${t.border}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{biblePlan.plan === 'custom' ? `${days}일` : planLabels[biblePlan.plan]} 통독</span>
              <span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>{progress.toFixed(1)}%</span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 8, borderRadius: 4, background: t.border, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: t.accent, borderRadius: 4, transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.sub }}>
              <span>{completedCount} / {totalChapters}장 완료</span>
              <span>{dayIndex + 1}일차 / {days}일</span>
            </div>
          </div>

          {/* Today's assignment */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 10 }}>
              {dayIndex >= days ? "남은 분량" : "오늘 읽을 분량"}
            </p>
            {todayAssignment.length === 0 && dayIndex < days && (
              <p style={{ fontSize: 13, color: t.sub }}>오늘은 읽을 분량이 없습니다</p>
            )}
            {todayAssignment.map((item, i) => {
              const key = `${item.bookId}-${item.chapter}`;
              const done = completedSet.has(key);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 5 }}>
                  <button onClick={() => toggleComplete(key)}
                    style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${done ? t.accent : t.border}`, background: done ? t.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 14, color: "#fff" }}>
                    {done ? "✓" : ""}
                  </button>
                  <button onClick={() => goToChapter(item.bookId, item.chapter)}
                    style={{ flex: 1, background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 14, color: done ? t.sub : t.text, textDecoration: done ? "line-through" : "none", fontFamily: "inherit" }}>
                    {item.bookName} {item.chapter}장
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tomorrow & day after */}
          {[{ label: "내일 분량", items: tomorrowAssignment }, { label: "모레 분량", items: dayAfterAssignment }].map(section => (
            section.items.length > 0 && (
              <div key={section.label} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.sub, marginBottom: 8 }}>{section.label}</p>
                {section.items.map(item => {
                  const key = `${item.bookId}-${item.chapter}`;
                  const done = completedSet.has(key);
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 4, opacity: 0.7 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${done ? t.accent : t.border}`, background: done ? t.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: "#fff" }}>
                        {done ? "✓" : ""}
                      </div>
                      <button onClick={() => goToChapter(item.bookId, item.chapter)}
                        style={{ flex: 1, background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: done ? t.sub : t.text, textDecoration: done ? "line-through" : "none", fontFamily: "inherit" }}>
                        {item.bookName} {item.chapter}장
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          ))}

          {/* Reset */}
          <button onClick={resetPlan}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: "transparent", color: t.sub, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            플랜 초기화
          </button>
        </div>
      </div>
    );
  };

  // ── WORSHIP SCREEN (예배) ──
  const WorshipScreen = () => {
    return (
      <div style={{ paddingBottom: 90 }}>
        <div style={{ padding: "24px 16px" }}>
          <button onClick={() => window.open('https://gntc.net/?page_id=3928', '_blank')}
            style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⛪</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>구역예배</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>구역공과 보기</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 18, color: t.sub }}>›</div>
          </button>
          <button onClick={() => navigate("familyWorship")}
            style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", marginTop: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏠</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>가정예배</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>오늘의 가정예배</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 18, color: t.sub }}>›</div>
          </button>
          <button onClick={() => navigate("sermon")}
            style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 16px", marginTop: 10, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: t.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎬</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>설교말씀</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>당회장 목사님 설교 영상</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 18, color: t.sub }}>›</div>
          </button>
        </div>
      </div>
    );
  };

  // ── FAMILY WORSHIP SCREEN (가정예배) ──
  const [familyData, setFamilyData] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState(null);
  const [familyCollapsed, setFamilyCollapsed] = useState({ hymn: true, body: true, bible: true });
  const [familyDate, setFamilyDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  const fetchFamilyData = useCallback((date) => {
    setFamilyLoading(true);
    setFamilyError(null);
    // Try /api/family first (Vercel - includes gntc.net scraping), fallback to direct JSONP call
    fetch(`/api/family?versions=kor&date=${date}`)
      .then(res => { if (!res.ok) throw new Error('api-fail'); return res.json(); })
      .then(data => { setFamilyData(data); setFamilyLoading(false); })
      .catch(() => {
        // Fallback: direct JSONP call to external API (no fullBody/prayer - local dev only)
        const cbName = '_familyCb' + Date.now();
        const script = document.createElement('script');
        window[cbName] = (data) => {
          setFamilyData(data);
          setFamilyLoading(false);
          delete window[cbName];
          script.remove();
        };
        script.src = `http://bible.gntc.net/WebService/Bible.asmx/getFamilyService?callback=${cbName}&versions=kor&date=${date}`;
        script.onerror = () => {
          setFamilyError("가정예배 데이터를 불러올 수 없습니다");
          setFamilyLoading(false);
          delete window[cbName];
          script.remove();
        };
        document.head.appendChild(script);
      });
  }, []);

  useEffect(() => {
    if (screen === "familyWorship") fetchFamilyData(familyDate);
  }, [screen, familyDate, fetchFamilyData]);

  const changeFamilyDate = (offset) => {
    const d = new Date(familyDate);
    d.setDate(d.getDate() + offset);
    const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    setFamilyDate(str);
    setFamilyCollapsed({ hymn: true, body: true, bible: true });
  };

  const FamilyWorshipScreen = () => {
    if (familyLoading) return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: t.sub, fontSize: 13 }}>가정예배를 불러오고 있습니다...</p>
      </div>
    );
    if (familyError) return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: t.sub, fontSize: 14 }}>{familyError}</p>
        <button onClick={() => fetchFamilyData(familyDate)} style={{ marginTop: 12, padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.accent}`, background: "transparent", color: t.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>다시 시도</button>
      </div>
    );
    if (!familyData) return null;

    // Use gntc.net fullBody/prayer if available, otherwise fall back to API summary
    const bodyText = familyData.fullBody || familyData.summary || '';
    const prayerText = familyData.prayer || '';

    return (
      <div style={{ paddingBottom: 90 }}>
        {/* Date navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${t.border}` }}>
          <button onClick={() => changeFamilyDate(-1)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", color: t.text, fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>‹ 이전</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{familyData.strDate}</div>
            <div style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>{familyData.dayOfWeek}</div>
          </div>
          <button onClick={() => changeFamilyDate(1)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, cursor: "pointer", color: t.text, fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>다음 ›</button>
        </div>

        <div style={{ padding: "16px" }}>
          {/* Title */}
          <div style={{ background: darkMode ? "linear-gradient(135deg, #1b3a1a, #1a2e1a)" : "linear-gradient(135deg, #f5f0e6, #f2ede3)", borderRadius: 12, padding: "18px 16px", marginBottom: 16, border: `1px solid ${darkMode ? '#2a4a2a' : '#e0dbd0'}` }}>
            <div style={{ fontSize: 10, color: t.accent, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>오늘의 가정예배</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.4 }}>{familyData.title}</h3>
            <p style={{ fontSize: 13, color: t.accent, marginTop: 8, fontWeight: 600 }}>{familyData.bookName} {familyData.sChapterNum}장 {familyData.sVerseNum > 0 ? `${familyData.sVerseNum}절` : ''}</p>
          </div>

          {/* Hymn */}
          {familyData.hymnNo && familyData.hymnNo !== "0" && (() => {
            const oNum = parseInt(familyData.hymnNo);
            const nNum = OLD2NEW[oNum] || (familyData.newHymnNo ? parseInt(familyData.newHymnNo) : null) || ((hymnsIndex.find(h => h.t === familyData.hymnTitle)) || {}).n || null;
            const fileNo = familyData.hymnFileNo ? parseInt(familyData.hymnFileNo) : null;
            const hymnSheetUrl = fileNo ? `https://choir.gntc.net/SNAS_MCIC/DATA/hymn/images/${fileNo}.png` : (nNum ? `/data/hymns/sheets/${String(nNum).padStart(3, '0')}.jpg` : null);
            const hymnAudioUrl = oNum ? `https://choir.gntc.net/SNAS_MCIC/DATA/hymn/ar/${oNum}.mp3` : null;
            const collapsed = familyCollapsed.hymn;
            return (
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px", marginBottom: 10 }}>
              <div onClick={() => setFamilyCollapsed(p => ({ ...p, hymn: !p.hymn }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 10, color: t.sub, fontWeight: 600, marginBottom: 4 }}>찬송가</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{oNum}장{nNum ? <span style={{ fontSize: 11, color: t.sub, fontWeight: 400 }}> (새찬송가 {nNum}장)</span> : null}</div>
                  <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{familyData.hymnTitle}</div>
                </div>
                <span style={{ fontSize: 12, color: t.sub, flexShrink: 0, padding: "4px 8px" }}>{collapsed ? "펼치기 ▼" : "접기 ▲"}</span>
              </div>
              {!collapsed && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${t.border}`, paddingTop: 10 }}>
                  {hymnAudioUrl && <audio controls preload="none" style={{ width: "100%", height: 36, marginBottom: 10 }}>
                    <source src={hymnAudioUrl} type="audio/mpeg" />
                  </audio>}
                  {hymnSheetUrl && <img src={hymnSheetUrl} alt={`${familyData.hymnTitle} 악보`} style={{ maxWidth: "100%", borderRadius: 8, boxShadow: `0 2px 8px ${t.shadow}` }} loading="lazy" />}
                </div>
              )}
            </div>);
          })()}

          {/* Bible text */}
          {familyData.texts && familyData.texts.length > 0 && (
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px", marginBottom: 10 }}>
              <div onClick={() => setFamilyCollapsed(p => ({ ...p, bible: !p.bible }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>본문말씀</div>
                <span style={{ fontSize: 12, color: t.sub, flexShrink: 0, padding: "4px 8px" }}>{familyCollapsed.bible ? "펼치기 ▼" : "접기 ▲"}</span>
              </div>
              {!familyCollapsed.bible && (
                <div style={{ marginTop: 10 }}>
                  {familyData.texts[0].text.map((text, i) => (
                    <div key={i} style={{ display: "flex", gap: 0, marginBottom: 2, padding: "6px 4px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.verseNum, minWidth: 24, paddingTop: 3, opacity: 0.7, flexShrink: 0 }}>{familyData.texts[0].verse[i]}</span>
                      <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, wordBreak: "keep-all", color: t.text }}>{text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Devotional body */}
          {bodyText && (
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "16px", marginBottom: 10 }}>
              <div onClick={() => setFamilyCollapsed(p => ({ ...p, body: !p.body }))} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>예배말씀</div>
                <span style={{ fontSize: 12, color: t.sub, flexShrink: 0, padding: "4px 8px" }}>{familyCollapsed.body ? "펼치기 ▼" : "접기 ▲"}</span>
              </div>
              {!familyCollapsed.body && (
                <div style={{ marginTop: 10 }}>
                  {bodyText.split('\n').map((line, i) => (
                    line.trim() ? <p key={i} style={{ fontSize: 14, lineHeight: 1.9, color: t.text, wordBreak: "keep-all", margin: "0 0 4px 0" }}>{line}</p>
                    : <div key={i} style={{ height: 8 }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prayer */}
          {prayerText && (
            <div style={{ background: darkMode ? "linear-gradient(135deg, #2a2215, #251f12)" : "linear-gradient(135deg, #fdf6e9, #faf0dc)", border: `1px solid ${darkMode ? '#3a3220' : '#e8dcc0'}`, borderRadius: 10, padding: "12px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#e67e22", fontWeight: 700, marginBottom: 6 }}>기도</div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: t.text, margin: 0, wordBreak: "keep-all" }}>{prayerText}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── SERMON SCREEN (설교말씀) ──
  const sermonCategories = ["주일예배", "월요기도회", "수요예배", "금요기도회"];
  const [sermonError, setSermonError] = useState(null);
  const sermonChannelIdRef = useRef(null);
  const sermonVideosRef = useRef({});

  // Keep refs in sync with state
  useEffect(() => { sermonChannelIdRef.current = sermonChannelId; }, [sermonChannelId]);
  useEffect(() => { sermonVideosRef.current = sermonVideos; }, [sermonVideos]);

  const fetchSermonChannelId = useCallback(async () => {
    if (sermonChannelIdRef.current) return sermonChannelIdRef.current;
    if (YOUTUBE_API_KEY === "YOUR_API_KEY_HERE") return null;
    try {
      // Try forHandle first (newer API), fall back to search
      let res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@GNTC&key=${YOUTUBE_API_KEY}`);
      let data = await res.json();
      if (data.items && data.items.length > 0) {
        const id = data.items[0].id;
        setSermonChannelId(id);
        return id;
      }
      // Fallback: search for channel
      res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=GNTC&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`);
      data = await res.json();
      if (data.items && data.items.length > 0) {
        const id = data.items[0].snippet.channelId;
        setSermonChannelId(id);
        return id;
      }
    } catch (e) {
      setSermonError("채널 정보를 불러올 수 없습니다");
    }
    return null;
  }, []);

  const fetchSermonVideos = useCallback(async (category) => {
    if (sermonVideosRef.current[category]) return;
    setSermonLoading(true);
    setSermonError(null);
    try {
      const channelId = await fetchSermonChannelId();
      if (!channelId) { setSermonLoading(false); return; }
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(category)}&type=video&order=date&maxResults=50&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      if (data.error) {
        setSermonError(data.error.message || "API 오류가 발생했습니다");
        setSermonLoading(false);
        return;
      }
      if (data.items) {
        const filtered = data.items.filter(v => v.snippet.title.includes(category));
        setSermonVideos(prev => ({ ...prev, [category]: filtered }));
      }
    } catch (e) {
      setSermonError("영상을 불러올 수 없습니다. 네트워크를 확인해주세요.");
    }
    setSermonLoading(false);
  }, [fetchSermonChannelId]);

  useEffect(() => {
    if (screen === "sermon") {
      fetchSermonVideos(sermonCategory);
    }
  }, [screen, sermonCategory, fetchSermonVideos]);

  const SermonScreen = () => {
    const videos = sermonVideos[sermonCategory] || [];

    return (
      <div style={{ paddingBottom: 90 }}>
        {/* Category tabs */}
        <div style={{ position: "sticky", top: 0, background: t.bg, zIndex: 50, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", gap: 6, padding: "12px 16px", overflowX: "auto" }}>
            {sermonCategories.map(cat => (
              <Pill key={cat} active={sermonCategory === cat} label={cat} onClick={() => setSermonCategory(cat)} small />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 8px" }}>
            <p style={{ fontSize: 10, color: t.sub, margin: 0 }}>업데이트를 누르면 최신 설교 영상을 확인할 수 있습니다</p>
            <button onClick={() => {
              sermonVideosRef.current = {};
              setSermonVideos({});
              fetchSermonVideos(sermonCategory);
            }} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${t.accent}`, background: t.accentBg, cursor: "pointer", fontSize: 11, fontWeight: 600, color: t.accent, fontFamily: "inherit", flexShrink: 0, marginLeft: 8 }}>
              업데이트
            </button>
          </div>
        </div>

        {YOUTUBE_API_KEY === "YOUR_API_KEY_HERE" ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.2 }}>🔑</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 8 }}>YouTube API 키를 설정해주세요</p>
            <p style={{ fontSize: 12, color: t.sub, lineHeight: 1.6 }}>
              app.jsx 상단의 YOUTUBE_API_KEY에<br/>
              Google Cloud Console에서 발급받은<br/>
              YouTube Data API v3 키를 입력하세요
            </p>
          </div>
        ) : sermonError ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.2 }}>⚠️</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 8 }}>오류가 발생했습니다</p>
            <p style={{ fontSize: 12, color: t.sub, lineHeight: 1.6, marginBottom: 16 }}>{sermonError}</p>
            <button onClick={() => { setSermonVideos(prev => { const next = {...prev}; delete next[sermonCategory]; return next; }); fetchSermonVideos(sermonCategory); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${t.accent}`, background: "transparent", color: t.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              다시 시도
            </button>
          </div>
        ) : sermonLoading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: t.sub, fontSize: 13 }}>영상을 불러오고 있습니다...</p>
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>🎬</div>
            <p style={{ color: t.sub, fontSize: 13 }}>영상이 없습니다</p>
          </div>
        ) : (
          <div style={{ padding: "12px 16px" }}>
            {videos.map((video) => (
              <button key={video.id.videoId} onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id.videoId}`, '_blank')}
                style={{ width: "100%", background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 0, marginBottom: 10, cursor: "pointer", textAlign: "left", overflow: "hidden" }}>
                <img
                  src={video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url}
                  alt={video.snippet.title}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  loading="lazy"
                />
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.4, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{video.snippet.title}</div>
                  <div style={{ fontSize: 11, color: t.sub }}>{new Date(video.snippet.publishedAt).toLocaleDateString('ko-KR')}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── NAV BAR ──
  const NavBar = () => (
    <div style={{ flexShrink: 0, width: "100%", background: t.nav, borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-around", padding: "4px 0 env(safe-area-inset-bottom, 8px)", zIndex: 100 }}>
      {[
        { id: "home", icon: "🏠", label: "홈" },
        { id: "bible", icon: "📖", label: "성경" },
        { id: "hymn", icon: "🎵", label: "찬송가" },
        { id: "worship", icon: "⛪", label: "예배" },
        { id: "tongdok", icon: "📋", label: "통독" },
        { id: "bookmarks", icon: "✨", label: "북마크" },
      ].map(item => (
        <button key={item.id} onClick={() => navigate(item.id)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, cursor: "pointer", padding: "6px 8px", color: mainTab === item.id ? t.text : t.sub, transition: "all 0.2s" }}>
          <span style={{ fontSize: 20, opacity: item.id === "bookmarks" && mainTab !== item.id ? 0.5 : 1 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: mainTab === item.id ? 700 : 400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );

  // ── HEADER CONFIG ──
  const hymnCategoryLabels = { hymn: "찬송가", ghymn: "은혜와진리찬양", khymn: "어린이 찬송가" };
  const headerConfig = {
    home: { title: "Grace and Truth Church", showBack: false },
    books: { title: "성경", showBack: false },
    chapters: { title: selectedBook?.name || "", showBack: true, backTarget: "bible" },
    reading: {
      title: selectedBook ? `${selectedBook.name} ${selectedChapter}장` : "",
      showBack: true, backTarget: fromTongdok ? "tongdok" : "chapters"
    },
    hymnCategory: { title: "찬송가", showBack: false },
    hymnList: { title: hymnCategoryLabels[hymnCategory] || "찬송가", showBack: true, backTarget: "hymnCategoryBack" },
    hymnDetail: { title: selectedHymn?.t || "", showBack: true, backTarget: "hymnListBack" },
    choirScreen: { title: "성가대찬양", showBack: true, backTarget: "hymnCategoryBack" },
    worship: { title: "예배", showBack: false },
    sermon: { title: "설교말씀", showBack: true, backTarget: "worship" },
    familyWorship: { title: "가정예배", showBack: true, backTarget: "worship" },
    tongdok: { title: "통독", showBack: false },
    bookmarks: { title: "북마크", showBack: false },
  };
  const hdr = headerConfig[screen] || { title: "", showBack: false };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ maxWidth: 480, margin: "0 auto", height: "100vh", height: "100dvh", background: t.bg, color: t.text, position: "relative", display: "flex", flexDirection: "column", transition: "background 0.3s, color 0.3s", overflow: "hidden" }}>
      <Header title={hdr.title} showBack={hdr.showBack} backTarget={hdr.backTarget} right={hdr.right} />
      {screen === "home" && HomeSearchHeader()}
      {screen === "hymnList" && HymnSearchHeader()}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        {screen === "home" && <HomeScreen />}
        {screen === "books" && <BooksScreen />}
        {screen === "chapters" && <ChaptersScreen />}
        {screen === "reading" && <ReadingScreen />}
        {screen === "hymnCategory" && <HymnCategoryScreen />}
        {screen === "hymnList" && <HymnListScreen />}
        {screen === "hymnDetail" && HymnDetailScreen()}
        {screen === "choirScreen" && <div style={{ position: "fixed", top: 48, left: 0, right: 0, bottom: 56, zIndex: 10, background: t.bg }}><iframe src="https://choir.gntc.net/mobile_ChoirCenter/index_mobile.php#ChoirPage1a" style={{ width: "100%", height: "100%", border: "none" }} title="성가대찬양" /></div>}
        {screen === "worship" && <WorshipScreen />}
        {screen === "sermon" && <SermonScreen />}
        {screen === "familyWorship" && <FamilyWorshipScreen />}
        {screen === "tongdok" && <TongdokScreen />}
        {screen === "bookmarks" && <BookmarksScreen />}
      </div>
      <NavBar />
    </div>
  );
};
