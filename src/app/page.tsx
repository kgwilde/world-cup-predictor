import Leaderboard from '@/components/leaderboard/Leaderboard';
import { FixtureSlider } from '@/components/FixtureSlider';
import { getResultsAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialResults = await getResultsAdmin().catch(() => []);
  return (
    <main className="min-h-screen bg-wc-black">
      <FixtureSlider initialResults={initialResults} />
      <Leaderboard />
    </main>
  );
}
