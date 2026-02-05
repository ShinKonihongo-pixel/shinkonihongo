import { useState } from 'react';
import { Eye, ChevronDown } from 'lucide-react';

interface RulesSectionProps {
  rules: string[];
}

export function RulesSection({ rules }: RulesSectionProps) {
  const [showRules, setShowRules] = useState(false);

  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={`rm-rules-toggle ${showRules ? 'open' : ''}`}
        onClick={() => setShowRules(!showRules)}
      >
        <Eye size={16} />
        <span>Xem trước luật chơi</span>
        <ChevronDown size={16} />
      </button>

      {showRules && (
        <div className="rm-rules">
          <h4 className="rm-rules-title">Luật chơi</h4>
          <ul className="rm-rules-list">
            {rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
