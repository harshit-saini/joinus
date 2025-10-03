// app/page.tsx
import Link from 'next/link';


export default function Home() {
  return (
    <div>
      <h2>Welcome to Invite App</h2>
      <p>Create beautiful invites and share the link.</p>
      <p>
        <Link href="/invite">➡️ Go to Create Invite</Link>
      </p>
    </div>
  );
}