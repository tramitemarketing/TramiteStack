// Palette dei colori assegnabili ai progetti.
export const PROJECT_PALETTE = [
  '#0F4C81', '#0E7C86', '#1F8A5B', '#2A78C2', '#7C5CD6', '#B4458E', '#D8553F', '#C8932B', '#5A6473',
]

// Selettore colore a pastiglie (radio): funziona anche senza JS (form server).
export function ColorSwatches({ name, value }: { name: string; value?: string | null }) {
  const selected = value || PROJECT_PALETTE[0]
  return (
    <div className="flex flex-wrap gap-2.5">
      {PROJECT_PALETTE.map((c) => (
        <label key={c} className="flex h-9 w-9 cursor-pointer items-center justify-center">
          <input type="radio" name={name} value={c} defaultChecked={c === selected} className="peer sr-only" />
          <span
            className="block h-7 w-7 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-white transition peer-checked:ring-[#1A1F2B] peer-focus-visible:ring-[#2A78C2]"
            style={{ backgroundColor: c }}
          />
        </label>
      ))}
    </div>
  )
}
