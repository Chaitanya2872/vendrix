import React from "react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
export function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (React.createElement("div", { className: "min-h-screen w-full bg-brand-background" },
        React.createElement(Sidebar, { open: sidebarOpen, onClose: () => setSidebarOpen(false) }),
        React.createElement("div", { className: "min-h-screen w-full lg:pl-65" },
            React.createElement(Topbar, { onMenuClick: () => setSidebarOpen(true) }),
            React.createElement("main", { className: "w-full p-4 md:p-6 lg:p-8" },
                React.createElement(Outlet, null)))));
}
