import { getPeople } from "@/lib/data";
import DirectoryClient from "./DirectoryClient";

export const metadata = { title: "Directory — Church Fathers" };

export default function DirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-2">Directory</h1>
      <p className="text-ink/60 mb-6">All {getPeople().length} figures, AD 30 – 750. Search by name, see, or role.</p>
      <DirectoryClient people={getPeople()} />
    </div>
  );
}
