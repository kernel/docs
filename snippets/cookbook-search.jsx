const { useState, useCallback } = React;

export const CookbookSearch = () => {
  const [matches, setMatches] = useState(null);

  const getCards = () => {
    const anchors = Array.from(
      document.querySelectorAll('a[href^="https://github.com/kernel/cookbooks/tree/main/"]')
    ).filter((a) => !a.closest('nav') && !a.closest('aside'));
    const cards = anchors.map((a) => a.closest('.card') || a);
    return Array.from(new Set(cards));
  };

  const handleInput = useCallback((e) => {
    const q = e.target.value.trim().toLowerCase();
    const cards = getCards();
    let count = 0;
    cards.forEach((card) => {
      const hit = q === '' || card.textContent.toLowerCase().includes(q);
      card.style.display = hit ? '' : 'none';
      if (hit) count++;
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
