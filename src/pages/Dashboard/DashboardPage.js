import { AlertTriangle, ArrowUpRight, Building2, CheckCircle2, Clock3, FileText, TrendingUp, } from "lucide-react";
import React from "react";
const statistics = [
    { label: "Total vendors", value: "248", detail: "+12 this month", icon: Building2, tone: "forest" },
    { label: "Active contracts", value: "184", detail: "74% of vendors", icon: FileText, tone: "sage" },
    { label: "Pending approvals", value: "16", detail: "Requires attention", icon: Clock3, tone: "amber" },
    { label: "Compliant vendors", value: "221", detail: "89.1% compliance", icon: CheckCircle2, tone: "forest" },
];
const vendors = [
    { name: "Apex Technologies", category: "IT Services", status: "Approved", date: "31 Jul 2026" },
    { name: "Greenline Supplies", category: "Office Supplies", status: "Pending", date: "30 Jul 2026" },
    { name: "Nova Industrial Works", category: "Manufacturing", status: "Approved", date: "29 Jul 2026" },
    { name: "Vertex Consulting", category: "Consulting", status: "Review", date: "28 Jul 2026" },
];
const statusStyles = {
    Approved: "bg-[#e6f1e9] text-brand-forest ring-[#cde2d3]",
    Pending: "bg-[#fbf0dc] text-[#8e6430] ring-[#eed9b1]",
    Review: "bg-[#edf0ed] text-[#526157] ring-[#dce2dc]",
};
const iconBackplates = {
    forest: "bg-[#e6f1e9] text-brand-forest",
    sage: "bg-[#edf1ed] text-[#526157]",
    amber: "bg-[#fbf0dc] text-[#8e6430]",
};
export function DashboardPage() {
    return (React.createElement("div", { className: "mx-auto w-full max-w-[1600px] space-y-7" },
        React.createElement("section", { className: "flex flex-col justify-between gap-4 sm:flex-row sm:items-end" },
            React.createElement("div", null,
                React.createElement("p", { className: "m-0 text-xs font-semibold uppercase tracking-[0.16em] text-brand-forest/65" }, "Workspace overview"),
                React.createElement("h1", { className: "mb-0 mt-2 text-[30px] font-semibold leading-none tracking-[-0.035em] text-brand-forest sm:text-[32px]" }, "Welcome back, Chaitanya"),
                React.createElement("p", { className: "mb-0 mt-2 text-sm text-brand-muted" }, "Here is an overview of your vendor ecosystem.")),
            React.createElement("button", { type: "button", className: "inline-flex h-10 items-center justify-center self-start rounded-lg bg-brand-forest px-4 text-sm font-medium text-white shadow-[0_2px_4px_rgba(35,75,53,0.18)] transition-colors hover:bg-brand-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest" }, "Add new vendor")),
        React.createElement("section", { "aria-label": "Key vendor metrics", className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" }, statistics.map((statistic) => {
            const Icon = statistic.icon;
            return (React.createElement("article", { key: statistic.label, className: "group flex min-h-[168px] flex-col rounded-xl border border-brand-border bg-brand-surface p-5 shadow-[0_1px_2px_rgba(31,45,36,0.03)] transition-shadow hover:shadow-[0_8px_20px_rgba(31,45,36,0.07)]" },
                React.createElement("div", { className: "flex items-start justify-between" },
                    React.createElement("div", { className: `grid h-9 w-9 place-items-center rounded-lg ${iconBackplates[statistic.tone]}` },
                        React.createElement(Icon, { className: "h-[18px] w-[18px]", strokeWidth: 1.9 })),
                    React.createElement(ArrowUpRight, { className: "h-4 w-4 text-brand-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" })),
                React.createElement("p", { className: "mb-0 mt-5 text-[29px] font-semibold leading-none tracking-[-0.035em] text-brand-forest" }, statistic.value),
                React.createElement("p", { className: "mb-0 mt-2 text-sm font-semibold text-brand-text" }, statistic.label),
                React.createElement("p", { className: "mb-0 mt-auto flex items-center gap-1.5 pt-3 text-xs text-brand-muted" },
                    statistic.label === "Total vendors" && React.createElement(TrendingUp, { className: "h-3.5 w-3.5 text-brand-forest" }),
                    statistic.detail)));
        })),
        React.createElement("section", { className: "grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_340px]" },
            React.createElement("article", { className: "min-w-0 overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-[0_1px_2px_rgba(31,45,36,0.03)]" },
                React.createElement("div", { className: "flex items-center justify-between border-b border-brand-border px-5 py-4.5" },
                    React.createElement("div", null,
                        React.createElement("h2", { className: "m-0 text-[15px] font-semibold text-brand-forest" }, "Recently added vendors"),
                        React.createElement("p", { className: "mb-0 mt-1 text-xs text-brand-muted" }, "Latest vendor onboarding activity")),
                    React.createElement("button", { type: "button", className: "rounded-md px-2 py-1 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest" }, "View all")),
                React.createElement("div", { className: "overflow-x-auto" },
                    React.createElement("table", { className: "w-full min-w-[620px] border-collapse text-left" },
                        React.createElement("thead", null,
                            React.createElement("tr", { className: "bg-[#faf9f7] text-[11px] uppercase tracking-[0.09em] text-brand-muted" },
                                React.createElement("th", { className: "px-5 py-3 font-semibold" }, "Vendor"),
                                React.createElement("th", { className: "px-5 py-3 font-semibold" }, "Category"),
                                React.createElement("th", { className: "px-5 py-3 font-semibold" }, "Status"),
                                React.createElement("th", { className: "px-5 py-3 text-right font-semibold" }, "Added"))),
                        React.createElement("tbody", null, vendors.map((vendor) => (React.createElement("tr", { key: vendor.name, className: "border-t border-brand-border text-sm transition-colors hover:bg-[#fafbf9]" },
                            React.createElement("td", { className: "px-5 py-[15px] font-semibold text-brand-text" }, vendor.name),
                            React.createElement("td", { className: "px-5 py-[15px] text-brand-muted" }, vendor.category),
                            React.createElement("td", { className: "px-5 py-[15px]" },
                                React.createElement("span", { className: `inline-flex rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[vendor.status]}` }, vendor.status)),
                            React.createElement("td", { className: "px-5 py-[15px] text-right text-brand-muted" }, vendor.date)))))))),
            React.createElement("article", { className: "rounded-xl border border-brand-border bg-brand-surface p-5 shadow-[0_1px_2px_rgba(31,45,36,0.03)]" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("div", { className: "grid h-9 w-9 place-items-center rounded-lg bg-[#fbf0dc] text-[#8e6430]" },
                        React.createElement(AlertTriangle, { className: "h-[18px] w-[18px]" })),
                    React.createElement("div", null,
                        React.createElement("h2", { className: "m-0 text-[15px] font-semibold text-brand-forest" }, "Attention required"),
                        React.createElement("p", { className: "m-0 text-xs text-brand-muted" }, "Compliance and approvals"))),
                React.createElement("div", { className: "mt-5 divide-y divide-brand-border border-y border-brand-border" }, [
                    ["8 documents expire soon", "Within the next 30 days"],
                    ["16 approvals pending", "Awaiting internal review"],
                    ["4 incomplete profiles", "Missing mandatory information"],
                ].map(([title, description]) => (React.createElement("div", { key: title, className: "group py-4 first:pt-3 last:pb-3" },
                    React.createElement("p", { className: "m-0 text-sm font-semibold text-brand-text transition-colors group-hover:text-brand-forest" }, title),
                    React.createElement("p", { className: "mb-0 mt-1 text-xs text-brand-muted" }, description)))))))));
}
