const { useState, useCallback } = React;

export const CookbookSearch = () => {
  const [matches, setMatches] = useState(null);

  const handleInput = useCallback((e) => {
    const q = e.target.value.trim().toLowerCase();
    let count = 0;
    document.querySelectorAll('#content .columns').forEach((section) => {
      let sectionCount = 0;
      section.querySelectorAll('.card').forEach((card) => {
        const hit = q === '' || card.textContent.toLowerCase().includes(q);
        card.style.display = hit ? '' : 'none';
        if (hit) sectionCount++;
      });
      const display = sectionCount > 0 ? '' : 'none';
      section.style.display = display;
      const heading = section.previousElementSibling;
      if (heading && heading.tagName === 'H2') heading.style.display = display;
      count += sectionCount;
    });
    setMatches(q === '' ? null : count);
  }, []);

  return (
    <div style={{ margin: '1.5rem 0 0.5rem' }}>
      <input
        type="search"
        placeholder="search cookbooks..."
        onInput={handleInput}
        aria-label="Search cookbooks"
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          fontSize: '0.9375rem',
          fontFamily: 'inherit',
          border: '1px solid rgba(128, 128, 128, 0.35)',
          borderRadius: '0.5rem',
          background: 'transparent',
          outline: 'none',
        }}
      />
      {matches === 0 && (
        <p style={{ marginTop: '1rem', opacity: 0.7 }}>
          no cookbooks match your search.
        </p>
      )}
    </div>
  );
};
