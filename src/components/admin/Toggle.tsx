'use client';

/**
 * The admin panel's on/off switch. One component rather than a copy per screen,
 * so the Status Config and Reference Fields pages cannot drift apart — they had
 * already started to (one carried aria-pressed, the other did not).
 */
export default function Toggle({
  on,
  onChange,
  disabled,
  label,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={label}
      aria-pressed={on}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        on ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
