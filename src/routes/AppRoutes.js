import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/Dashboard/DashboardPage";
import React from "react";
function PlaceholderPage({ title }) {
    return (React.createElement("section", null,
        React.createElement("h1", { className: "m-0 text-2xl font-semibold text-brand-forest" }, title),
        React.createElement("p", { className: "mb-0 mt-2 text-sm text-brand-muted" }, "This page is ready for implementation.")));
}
export function AppRoutes() {
    return (React.createElement(Routes, null,
        React.createElement(Route, { element: React.createElement(AppLayout, null) },
            React.createElement(Route, { index: true, element: React.createElement(DashboardPage, null) }),
            React.createElement(Route, { path: "vendors", element: React.createElement(PlaceholderPage, { title: "Vendors" }) }),
            React.createElement(Route, { path: "contracts", element: React.createElement(PlaceholderPage, { title: "Contracts" }) }),
            React.createElement(Route, { path: "documents", element: React.createElement(PlaceholderPage, { title: "Documents" }) }),
            React.createElement(Route, { path: "users", element: React.createElement(PlaceholderPage, { title: "Users" }) }),
            React.createElement(Route, { path: "settings", element: React.createElement(PlaceholderPage, { title: "Settings" }) })),
        React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/", replace: true }) })));
}
