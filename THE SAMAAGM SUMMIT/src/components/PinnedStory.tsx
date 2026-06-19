const FRAMES = [
  { big: "Six committees. Your vote.", sub: "Two agendas each — the community voted, and the winning agenda took the floor." },
  { big: "Youth at the helm.", sub: "Students, thinkers, and future leaders, on one platform." },
  { big: "India's first democratic summit.", sub: "31 July – 2 August 2026 · Indore." },
];

/**
 * Editorial mission-statement sequence. In-flow (no position:sticky) so it stays
 * robust under the page's overflow-x:hidden; each line reveals on scroll.
 */
export function PinnedStory() {
  return (
    <section className="ps" aria-label="The Samaagm Summit — in brief">
      <div className="h-wrap ps-inner">
        {FRAMES.map((f, i) => (
          <div
            key={f.big}
            className="ps-frame h-reveal"
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <span className="ps-idx">0{i + 1}</span>
            <h2 className="ps-big">{f.big}</h2>
            <p className="ps-sub">{f.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
