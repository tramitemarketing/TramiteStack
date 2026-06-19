import { signOut } from '@/app/login/actions'

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 active:text-slate-700"
      >
        Esci
      </button>
    </form>
  )
}
