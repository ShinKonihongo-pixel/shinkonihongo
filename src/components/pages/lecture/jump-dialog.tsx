// Jump to slide dialog

import { useRef, useEffect } from 'react';

interface JumpDialogProps {
  maxSlides: number;
  jumpInput: string;
  onInputChange: (value: string) => void;
  onJump: () => void;
  onClose: () => void;
}

export function JumpDialog({
  maxSlides,
  jumpInput,
  onInputChange,
  onJump,
  onClose,
}: JumpDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="jump-dialog" onClick={(e) => e.stopPropagation()}>
      <label>Chuyển đến slide:</label>
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={maxSlides}
        value={jumpInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onJump();
          if (e.key === 'Escape') onClose();
        }}
        placeholder={`1-${maxSlides}`}
      />
      <button onClick={onJump}>Go</button>
    </div>
  );
}
