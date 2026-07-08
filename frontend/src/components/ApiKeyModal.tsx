import { useState } from "react";
import { FiCopy, FiKey } from "react-icons/fi";

interface Props {
  apiKey: string;
  onClose: () => void;
}

export default function ApiKeyModal({ apiKey, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2><FiKey /> API Key Rotated</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <p style={{ marginBottom: 16, fontSize: 14, color: "var(--text-secondary)" }}>
          Your new API key is shown below. <strong>Copy it now</strong> — it
          won't be shown again.
        </p>

        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          The old key has been invalidated. Update any services using the old key.
        </div>

        <div className="key-display" style={{ marginBottom: 16 }}>
          <code className="break-all">{apiKey}</code>
          <button onClick={handleCopy} className="btn-secondary btn-sm">
            {copied ? "✓ Copied" : <><FiCopy /> Copy</>}
          </button>
        </div>

        <button onClick={onClose} className="btn-primary btn-full">Done</button>
      </div>
    </div>
  );
}
