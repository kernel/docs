const { useState, useCallback } = React;

const PROMPT = `# Setup Kernel

## Prerequisites
- Read the kernel-cli skill at https://github.com/kernel/skills/blob/main/plugins/kernel-cli/skills/kernel-cli/SKILL.md for reference on commands and capabilities.

## Steps

1. **Check if Kernel CLI is installed:**
   - Run \`kernel --version\`.
   - If not found, install via \`brew install kernel/tap/kernel\`.
   - If found, run \`brew upgrade kernel/tap/kernel\` to ensure latest version.
   - Verify with \`kernel --version\` and confirm >= v0.16.0.

2. **Check authentication:**
   - Run \`kernel auth\`.
   - If authenticated, done.
   - If not, run \`kernel login\` and tell the user to complete the browser flow.
     Poll \`kernel auth\` every 5 seconds, up to 5 minutes.
     If it times out, stop and ask the user for help.

3. **Create a browser and open Live View:**
   - Run a Kernel CLI command that creates a browser session and goes to \`https://www.kernel.sh/docs/browsers/live-view\`
   - Capture the returned \`browser_live_view_url\`.
   - Open that URL in the user's browser.
   - Tell the user they can use the live view immediately.
   - If browser creation fails, stop and ask the user for help.`;

export const CopyPromptButton = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = PROMPT;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: '100%',
        maxWidth: '352px',
        height: '56px',
        padding: '0 32px',
        fontSize: '0.9375rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        color: '#fff',
        backgroundColor: '#111',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#222';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#111';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
          copied!
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
            <path d="M10.5 5.5V3.5C10.5 2.67 9.83 2 9 2H3.5C2.67 2 2 2.67 2 3.5V9C2 9.83 2.67 10.5 3.5 10.5H5.5" />
          </svg>
          copy prompt
        </>
      )}
    </button>
  );
};
