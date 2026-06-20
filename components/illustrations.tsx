// Illustrazioni per gli stati vuoti (dal sistema grafico T-Stack).

export function EmptyHome() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="22" fill="#EEF5FC" />
      <path d="M22 32l7 7 14-14" stroke="#0F4C81" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="49" cy="18" r="2.4" fill="#F2C14E" />
      <circle cx="14" cy="22" r="2" fill="#7DB2E6" />
      <circle cx="50" cy="45" r="1.8" fill="#7DB2E6" />
    </svg>
  )
}

export function EmptyTasks() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="12" y="16" width="12" height="32" rx="3" fill="#EEF5FC" stroke="#B3D2F0" strokeWidth="2" />
      <rect x="26" y="16" width="12" height="32" rx="3" fill="#EEF5FC" stroke="#B3D2F0" strokeWidth="2" />
      <rect x="40" y="16" width="12" height="32" rx="3" fill="#FDF4DD" stroke="#F2C14E" strokeWidth="2" />
      <circle cx="46" cy="14" r="6" fill="#fff" stroke="#0F4C81" strokeWidth="2" />
      <path d="M46 11.5v5M43.5 14h5" stroke="#0F4C81" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyCalendar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="14" y="16" width="36" height="34" rx="5" fill="#EEF5FC" stroke="#B3D2F0" strokeWidth="2" />
      <path d="M14 26h36" stroke="#B3D2F0" strokeWidth="2" />
      <path d="M23 12v6M41 12v6" stroke="#0F4C81" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 38h12" stroke="#9CA5B3" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="49" cy="47" r="2" fill="#F2C14E" />
    </svg>
  )
}

export function EmptyBudget() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect x="13" y="20" width="38" height="26" rx="5" fill="#EEF5FC" stroke="#B3D2F0" strokeWidth="2" />
      <path d="M13 28h38" stroke="#B3D2F0" strokeWidth="2" />
      <circle cx="44" cy="37" r="2.4" fill="#0F4C81" />
      <circle cx="34" cy="50" r="9" fill="#fff" stroke="#1F8A5B" strokeWidth="2" />
      <path d="M37 47a3.2 3.2 0 1 0 0 6M31.5 49h4M31.5 51h3" stroke="#1F8A5B" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyProjects() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M12 22a3 3 0 0 1 3-3h9l4 5h13a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z" fill="#EEF5FC" stroke="#B3D2F0" strokeWidth="2" />
      <circle cx="44" cy="20" r="7" fill="#fff" stroke="#0F4C81" strokeWidth="2" />
      <path d="M44 17v6M41 20h6" stroke="#0F4C81" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
