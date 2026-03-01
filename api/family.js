export default async function handler(req, res) {
  const { date, versions } = req.query;
  const url = `http://bible.gntc.net/WebService/Bible.asmx/getFamilyService?callback=&versions=${versions || 'kor'}&date=${date || ''}`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    const json = text.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(json);

    // Scrape gntc.net for full body text + prayer
    try {
      // Calculate vid from date (reference: 2026-03-02 = vid 3558)
      const refDate = new Date('2026-03-02T00:00:00+09:00');
      const targetDate = date ? new Date(date + 'T00:00:00+09:00') : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }).split(',')[0] + 'T00:00:00+09:00');
      const diffDays = Math.round((targetDate - refDate) / (1000 * 60 * 60 * 24));
      const vid = 3558 + diffDays;

      const pageRes = await fetch(`https://gntc.net/?page_id=138&vid=${vid}`);
      const pageHtml = await pageRes.text();

      // Extract content from td.content-box
      const contentMatch = pageHtml.match(/content-box[^>]*>([\s\S]*?)<\/td>/);
      if (contentMatch) {
        const raw = contentMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
        // Remove ● 성경 : ... and ● 찬송 : ... lines
        const cleaned = raw.replace(/●\s*성경\s*[:：][^\n]*/g, '').replace(/●\s*찬송\s*[:：][^\n]*/g, '').trim();
        // Find the LAST occurrence of 기도: (to avoid matching "기도하고" in body text)
        const prayerRegex = /기도\s*[:：]\s*/g;
        let lastMatch = null;
        let m;
        while ((m = prayerRegex.exec(cleaned)) !== null) {
          lastMatch = m;
        }
        if (lastMatch) {
          data.fullBody = cleaned.slice(0, lastMatch.index).trim();
          data.prayer = cleaned.slice(lastMatch.index + lastMatch[0].length).trim();
        } else {
          data.fullBody = cleaned;
          data.prayer = '';
        }
      }
    } catch (_) {
      // gntc.net scraping failed - continue with API data only
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch family worship data' });
  }
}
