import type { SelectOption } from './types';

interface SelectButtonsProps {
  options: SelectOption[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  multiSelect?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function SelectButtons({
  options,
  selected,
  onChange,
  multiSelect = false,
  size = 'medium',
}: SelectButtonsProps) {
  const handleClick = (value: string | number) => {
    if (multiSelect) {
      if (selected.includes(value)) {
        if (selected.length > 1) {
          onChange(selected.filter(s => s !== value));
        }
      } else {
        onChange([...selected, value]);
      }
    } else {
      onChange([value]);
    }
  };

  const sizeClass = size === 'small' ? 'sm' : size === 'large' ? 'lg' : '';

  return (
    <div className="rm-pills">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`rm-pill ${sizeClass} ${selected.includes(opt.value) ? 'active' : ''}`}
          onClick={() => handleClick(opt.value)}
          data-level={typeof opt.value === 'string' && opt.value.startsWith('N') ? opt.value : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
