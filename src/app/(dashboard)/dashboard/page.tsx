export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Statistika kartlari — Sprint 5 da to'liq qo'shiladi */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Bugungi tushum", value: "0 so'm", color: "bg-blue-50 text-blue-700" },
          { label: "Sof foyda", value: "0 so'm", color: "bg-green-50 text-green-700" },
          { label: "Sotuvlar soni", value: "0", color: "bg-purple-50 text-purple-700" },
          { label: "Kam qoldi", value: "0 ta", color: "bg-orange-50 text-orange-700" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl p-4 ${card.color}`}>
            <p className="text-sm font-medium opacity-75">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <p className="text-gray-400 text-sm text-center py-8">
        Dashboard Sprint 5 da to&apos;liq tayyor bo&apos;ladi
      </p>
    </div>
  );
}
