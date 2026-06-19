import { redirect } from 'next/navigation'

// La root reindirizza alla dashboard; il proxy gestisce l'auth.
export default function Home() {
  redirect('/dashboard')
}
