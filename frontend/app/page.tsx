// app/page.tsx
import { redirect } from 'next/navigation';

export default function IndexPage() {
  redirect('/hero'); // You can change this to /landing or /dashboard later
}