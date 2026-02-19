// @refresh reset
interface RulesSectionProps {
  rules: string[];
}

export function RulesSection({ rules }: RulesSectionProps) {
  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <div className="rm-rules">
      <h4 className="rm-rules-title">Luật chơi</h4>
      <ul className="rm-rules-list">
        {rules.map((rule, i) => (
          <li key={i}>
            <span className="rm-rules-bullet" />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
