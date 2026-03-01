export default async function handler(req, res) {
  const { date, versions } = req.query;
  const url = `http://bible.gntc.net/WebService/Bible.asmx/getFamilyService?callback=&versions=${versions || 'kor'}&date=${date || ''}`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    // Remove JSONP wrapper: callbackName(...) -> ...
    const json = text.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).send(json);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch family worship data' });
  }
}
