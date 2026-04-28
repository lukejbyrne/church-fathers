import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <h1 className="font-serif text-5xl mb-4">Not found</h1>
      <p className="text-ink/60 mb-6">That figure isn't in the lineage.</p>
      <Link href="/directory" className="text-accent hover:underline">Browse the directory →</Link>
    </div>
  );
}
