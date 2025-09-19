import TabsBar from "@/components/mem/TabsBar";

export default function DashboardHome() {
  return (
    <>
      <TabsBar />
      <section className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200 font-semibold">Recent Messages</div>
          <div className="p-4 text-slate-500">No conversations yet. Send a message to start chatting!</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 min-h-[260px]" />
      </section>
    </>
  );
}



