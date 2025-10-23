import TBList from "./TBList";
import ArtifactsList from "./ArtifactsList";
import PromptPanel from "./PromptPanel";

export default async function ProfilePage() {
  // (Server-side fetch for identity & existing artifacts if you want)
  return (
    <main className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6">
      <section className="md:col-span-2 space-y-6">
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Identity</h2>
          <p className="text-sm">Spencer Wendt • Verified voice ✅</p>
        </div>
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Trust Bonds</h2>
          <TBList />
        </div>
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold mb-2">Artifacts</h2>
          <ArtifactsList />
        </div>
      </section>
      <section className="md:col-span-3">
        <PromptPanel />
      </section>
    </main>
  );
}
