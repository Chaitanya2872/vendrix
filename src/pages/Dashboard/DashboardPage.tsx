import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Plus
} from "lucide-react";

const statistics = [
  {
    label: "Total vendors",
    value: "248",
    description: "+12 this month",
    icon: Building2,
    iconStyle: "bg-emerald-50 text-brand-forest",
  },
  {
    label: "Active contracts",
    value: "184",
    description: "74% of vendors",
    icon: FileText,
    iconStyle: "bg-blue-50 text-blue-700",
  },
  {
    label: "Pending approvals",
    value: "16",
    description: "Requires attention",
    icon: Clock3,
    iconStyle: "bg-amber-50 text-amber-700",
  },
  {
    label: "Compliant vendors",
    value: "221",
    description: "89.1% compliance",
    icon: CheckCircle2,
    iconStyle: "bg-green-50 text-green-700",
  },
];

const vendors = [
  {
    name: "Apex Technologies",
    initials: "AT",
    category: "IT Services",
    status: "Approved",
    date: "31 Jul 2026",
  },
  {
    name: "Greenline Supplies",
    initials: "GS",
    category: "Office Supplies",
    status: "Pending",
    date: "30 Jul 2026",
  },
  {
    name: "Nova Industrial Works",
    initials: "NW",
    category: "Manufacturing",
    status: "Approved",
    date: "29 Jul 2026",
  },
  {
    name: "Vertex Consulting",
    initials: "VC",
    category: "Consulting",
    status: "Review",
    date: "28 Jul 2026",
  },
];

const attentionItems = [
  {
    title: "8 documents expire soon",
    description: "Within the next 30 days",
    color: "bg-amber-50 text-amber-700",
  },
  {
    title: "16 approvals pending",
    description: "Awaiting internal review",
    color: "bg-blue-50 text-blue-700",
  },
  {
    title: "4 incomplete profiles",
    description: "Missing mandatory information",
    color: "bg-rose-50 text-rose-700",
  },
];

function getStatusClasses(status: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";

    case "Pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/10";

    default:
      return "bg-blue-50 text-blue-700 ring-blue-600/10";
  }
}

export function DashboardPage() {
  return (
    <div className="w-full space-y-5">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-brand-forest md:text-2xl">
            Welcome back, Chaitanya
          </h1>

          <p className="mb-0 mt-1 text-sm text-brand-muted">
            Here is an overview of your vendor ecosystem.
          </p>
        </div>

        <button
  type="button"
  className="inline-flex items-center gap-3 rounded-xl bg-brand-forest px-3 py-1.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-forest-light hover:shadow-lg"
>
  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-forest">
    <Plus size={16} strokeWidth={2.5} />
  </span>

  Add New Vendor
</button>
      </section>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => {
          const Icon = statistic.icon;

          return (
            <article
              key={statistic.label}
              className="group flex h-32 flex-col justify-between rounded-xl border border-brand-border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-lg ${statistic.iconStyle}`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                </div>

                <ArrowUpRight className="h-4 w-4 text-brand-muted transition group-hover:text-brand-forest" />
              </div>

              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="m-0 text-2xl font-semibold leading-none tracking-tight text-brand-forest">
                    {statistic.value}
                  </p>

                  <p className="mb-0 mt-1.5 text-sm font-medium text-brand-text">
                    {statistic.label}
                  </p>
                </div>

                <p className="m-0 hidden whitespace-nowrap text-xs text-brand-muted 2xl:block">
                  {statistic.description}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      {/* Main dashboard content */}
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Recent vendors table */}
        <article className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
            <div>
              <h2 className="m-0 text-base font-semibold text-brand-forest">
                Recently added vendors
              </h2>

              <p className="mb-0 mt-1 text-xs text-brand-muted">
                Latest vendor onboarding activity
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-gold-dark transition hover:bg-brand-background"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-175 border-collapse text-left">
              <thead className="bg-brand-background/50">
                <tr className="text-xs uppercase tracking-wide text-brand-muted">
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Added</th>
                </tr>
              </thead>

              <tbody>
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.name}
                    className="border-t border-brand-border transition hover:bg-brand-background/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-background text-xs font-semibold text-brand-forest">
                          {vendor.initials}
                        </div>

                        <span className="whitespace-nowrap text-sm font-medium text-brand-text">
                          {vendor.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-sm text-brand-muted">
                      {vendor.category}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                          vendor.status,
                        )}`}
                      >
                        {vendor.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-sm text-brand-muted">
                      {vendor.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-brand-border px-5 py-3">
            <p className="m-0 text-xs text-brand-muted">
              Showing 4 of 248 vendors
            </p>

            <button
              type="button"
              className="text-xs font-medium text-brand-forest hover:underline"
            >
              Manage vendors
            </button>
          </div>
        </article>

        {/* Attention panel */}
        <article className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
            </div>

            <div>
              <h2 className="m-0 text-base font-semibold text-brand-forest">
                Attention required
              </h2>

              <p className="m-0 mt-0.5 text-xs text-brand-muted">
                Compliance and approvals
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {attentionItems.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition hover:border-brand-border hover:bg-brand-background/50"
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold ${item.color}`}
                >
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-medium text-brand-text">
                    {item.title}
                  </p>

                  <p className="mb-0 mt-0.5 text-xs text-brand-muted">
                    {item.description}
                  </p>
                </div>

                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-brand-muted transition group-hover:text-brand-forest" />
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}