import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
function Breadcrumb({ className, ...props }) {
    return (React.createElement("nav", { "aria-label": "breadcrumb", "data-slot": "breadcrumb", className: cn(className), ...props }));
}
function BreadcrumbList({ className, ...props }) {
    return (React.createElement("ol", { "data-slot": "breadcrumb-list", className: cn("flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground", className), ...props }));
}
function BreadcrumbItem({ className, ...props }) {
    return (React.createElement("li", { "data-slot": "breadcrumb-item", className: cn("inline-flex items-center gap-1", className), ...props }));
}
function BreadcrumbLink({ className, render, ...props }) {
    return useRender({
        defaultTagName: "a",
        props: mergeProps({
            className: cn("transition-colors hover:text-foreground", className),
        }, props),
        render,
        state: {
            slot: "breadcrumb-link",
        },
    });
}
function BreadcrumbPage({ className, ...props }) {
    return (React.createElement("span", { "data-slot": "breadcrumb-page", role: "link", "aria-disabled": "true", "aria-current": "page", className: cn("font-normal text-foreground", className), ...props }));
}
function BreadcrumbSeparator({ children, className, ...props }) {
    return (React.createElement("li", { "data-slot": "breadcrumb-separator", role: "presentation", "aria-hidden": "true", className: cn("[&>svg]:size-3.5", className), ...props }, children ?? (React.createElement(ChevronRightIcon, null))));
}
function BreadcrumbEllipsis({ className, ...props }) {
    return (React.createElement("span", { "data-slot": "breadcrumb-ellipsis", role: "presentation", "aria-hidden": "true", className: cn("flex size-5 items-center justify-center [&>svg]:size-4", className), ...props },
        React.createElement(MoreHorizontalIcon, null),
        React.createElement("span", { className: "sr-only" }, "More")));
}
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, };
