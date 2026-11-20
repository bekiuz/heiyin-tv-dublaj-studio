import { useEffect, useMemo, useState } from 'react';

type Item = {
  id: number;
  title: string;
  type: string;
  year: number | null;
  description: string | null;
  poster_url: string | null;
};

const API = 'https://heiyin-tv-api.bekiuz67.workers.dev';
const categories = [
  { value: 'HAMMASI', label: 'Hammasi' },
  { value: 'ANIME', label: 'Anime' },
  { value: 'FILM', label: 'Filmlar' },
  { value: 'SERIAL', label: 'Seriallar' },
];

function typeLabel(type: string) {
  const normalized = type.toUpperCase();
  if (normalized === 'ANIME') return 'Anime';
  if (normalized === 'FILM') return 'Film';
  if (normalized === 'SERIAL') return 'Serial';
  return type;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('HAMMASI');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Item | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (category !== 'HAMMASI') params.set('type', category);

      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API}/api/catalog?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.results)) throw new Error('Invalid catalog response');
        setItems(data.results);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError('Katalogni yuklab bo‘lmadi. Internet yoki server aloqasini tekshiring.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, category]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);

  const resultLabel = useMemo(() => {
    if (loading) return 'Yuklanmoqda';
    return `${items.length} ta natija`;
  }, [items.length, loading]);

  return (
    <main id="home">
      <div className="announcement">
        <span className="announcement-dot" />
        HEIYIN TV — anime, film va seriallar bir joyda
      </div>

      <header className="site-header">
        <a className="logo" href="#home" aria-label="HEIYIN TV bosh sahifa">
          <span className="logo-mark">H</span>
          <span>HEIYIN<span className="logo-accent">TV</span></span>
        </a>
        <nav aria-label="Asosiy navigatsiya">
          <a className="nav-active" href="#home">Bosh sahifa</a>
          <a href="#catalog">Katalog</a>
          <a href="#about">Biz haqimizda</a>
        </nav>
        <a className="header-cta" href="#catalog">Katalogni ochish <span>↗</span></a>
      </header>

      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <p className="eyebrow"><span /> SIZNING YANGI SEVIMLI MAKONINGIZ</p>
          <h1>Har bir hikoya<br />o‘z <span>olamiga</span> ega.</h1>
          <p className="hero-description">
            Sevimli anime, filmlar va seriallaringizni kashf eting.
            Yangi sarguzashtlar shu yerdan boshlanadi.
          </p>
          <div className="hero-actions">
            <a className="button-primary" href="#catalog">Katalogni ko‘rish <span>↓</span></a>
            <a className="button-quiet" href="#about">HEIYIN TV haqida <span>↗</span></a>
          </div>
          <div className="hero-meta">
            <div><strong>01</strong><span>Yagona katalog</span></div>
            <i />
            <div><strong>24/7</strong><span>Har doim ochiq</span></div>
            <i />
            <div><strong>UZ</strong><span>O‘zbekcha muhit</span></div>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-main-card">
            <div className="art-topline"><span>HEIYIN ORIGINAL</span><span>✦ 01</span></div>
            <div className="art-emblem"><span>H</span></div>
            <div className="art-bottom">
              <span>YOUR NEXT STORY</span>
              <strong>BEGINS HERE.</strong>
            </div>
          </div>
          <div className="floating-chip chip-top">✦ Yangi olamlar</div>
          <div className="floating-chip chip-bottom"><span>●</span> Discover something new</div>
        </div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="section-heading">
          <div>
            <p className="eyebrow">HEIYIN LIBRARY</p>
            <h2>O‘z hikoyangni <span>tanla.</span></h2>
            <p className="section-subtitle">Qidir, tanla va navbatdagi sevimli asaringni top.</p>
          </div>
          <div className="catalog-count"><strong>{items.length.toString().padStart(2, '0')}</strong><span>{resultLabel}</span></div>
        </div>

        <div className="catalog-toolbar">
          <div className="filters" role="group" aria-label="Kontent turi">
            {categories.map((item) => (
              <button
                className={category === item.value ? 'filter-button active' : 'filter-button'}
                onClick={() => setCategory(item.value)}
                key={item.value}
                type="button"
                aria-pressed={category === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="search"
              placeholder="Nomi bo‘yicha qidirish..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Katalogdan qidirish"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Qidiruvni tozalash">×</button>}
          </label>
        </div>

        {loading ? (
          <div className="catalog-state"><span className="loader" /><strong>Katalog yuklanmoqda</strong><p>Yangi hikoyalar tayyorlanmoqda...</p></div>
        ) : error ? (
          <div className="catalog-state state-error"><span className="state-symbol">!</span><strong>Aloqa amalga oshmadi</strong><p>{error}</p><button className="retry-button" onClick={() => setCategory((value) => value)} type="button">Qayta urinish</button></div>
        ) : items.length === 0 ? (
          <div className="catalog-state"><span className="state-symbol">✦</span><strong>{query ? 'Hech narsa topilmadi' : 'Katalog hozircha bo‘sh'}</strong><p>{query ? 'Boshqa nom bilan qidirib ko‘ring yoki filtrni o‘zgartiring.' : 'Yangi anime, film va seriallar tez orada qo‘shiladi.'}</p>{query && <button className="retry-button" onClick={() => setQuery('')} type="button">Qidiruvni tozalash</button>}</div>
        ) : (
          <div className="content-grid">
            {items.map((item, index) => (
              <article className="content-card" key={item.id}>
                <button className="card-open" type="button" onClick={() => setSelected(item)} aria-label={`${item.title} haqida batafsil`}>
                  <div className="poster">
                    <div className="poster-fallback"><span>H</span><small>HEIYIN TV</small></div>
                    {item.poster_url && <img src={item.poster_url} alt={item.title} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                    <span className="poster-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="poster-play">▶</span>
                    <span className="poster-type">{typeLabel(item.type)}</span>
                  </div>
                  <div className="card-details">
                    <div className="card-meta"><span>{typeLabel(item.type)}</span>{item.year && <><i />{item.year}</>}</div>
                    <h3>{item.title}</h3>
                    <p>{item.description || 'Ushbu asar haqida batafsil ma’lumot tez orada qo‘shiladi.'}</p>
                    <span className="card-more">Batafsil <b>↗</b></span>
                  </div>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="about-strip" id="about">
        <div className="about-mark">H</div>
        <div><p className="eyebrow">BIZNING MAQSAD</p><h2>Yaxshi hikoyalar <span>birlashtiradi.</span></h2><p>HEIYIN TV — anime, film va seriallarni topish uchun yaratilgan yagona katalog.</p></div>
        <a href="#home" className="back-top" aria-label="Yuqoriga qaytish">↑</a>
      </section>

      <footer className="site-footer">
        <a className="logo footer-logo" href="#home"><span className="logo-mark">H</span><span>HEIYIN<span className="logo-accent">TV</span></span></a>
        <span>Hikoyalar olamiga xush kelibsiz.</span>
        <small>© 2026 HEIYIN TV</small>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <button className="modal-close" onClick={() => setSelected(null)} type="button" aria-label="Yopish">×</button>
            <div className="modal-poster">
              <div className="poster-fallback"><span>H</span><small>HEIYIN TV</small></div>
              {selected.poster_url && <img src={selected.poster_url} alt={selected.title} onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
            </div>
            <div className="modal-content">
              <p className="eyebrow">{typeLabel(selected.type)}{selected.year ? ` · ${selected.year}` : ''}</p>
              <h2 id="detail-title">{selected.title}</h2>
              <p>{selected.description || 'Ushbu asar haqida batafsil ma’lumot tez orada qo‘shiladi.'}</p>
              <span className="modal-note">Ko‘rish manbasi tez orada qo‘shiladi.</span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
