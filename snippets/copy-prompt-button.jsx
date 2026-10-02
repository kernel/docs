const { useState, useCallback } = React;

export const CopyPromptButton = (props) => {
  const { label = 'copy prompt' } = props || {};
  const [copied, setCopied] = useState(false);

  const prompt = (props && props.prompt) || `Use Kernel for this task: [describe what you want to build or automate]. If I leave this blank, run the recommended example below.

Recommended example: launch a Kernel browser and start a replay recording. Search for the same product on amazon.com and walmart.com (ask me for a product, or pick a common one such as a 65-inch 4K TV), compare price, shipping cost, and delivery estimate, and tell me which is the better deal. Stop the recording when finished, download the replay, and share it with me so I can watch the run.

First, use the official Kernel instructions and skills:
- Read https://kernel.sh/auth.md.
- If Kernel credentials already exist, validate and reuse them. If not, ask for my consent and follow the verified-email flow in auth.md so I can provide the one-time code; do not send me through the normal dashboard signup flow.
- Run [npx skills add https://github.com/kernel/skills], select only the skills relevant to this task, and follow their instructions.

Choose the least-powerful Kernel interface that fits the existing project: CLI, TypeScript SDK, Python SDK, MCP, agent-browser, or browser-harness. Keep API keys, claim tokens, credentials, CDP URLs, and profile data out of chat, logs, source, commits, and generated files. Share hosted login, organization-selection, or live-view URLs only with me when needed. Scope work to the intended Kernel project, verify current syntax with `kernel <command> --help`, set bounded browser timeouts, preserve authenticated profiles only when useful, and always delete temporary browsers and pools in guaranteed cleanup.

Complete the task and report what ran, what was verified, and any remaining human action.`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
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
        textDecoration: 'none',
        transition: 'text-decoration 0.15s ease',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
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
          {label}
        </>
      )}
    </button>
  );
};
