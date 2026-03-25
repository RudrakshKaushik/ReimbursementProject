import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconUsers,
  IconFolder,
  IconReceipt,
} from "@tabler/icons-react";

type NavItem = {
  key: string;
  label: string;
  path: string;
  icon?: React.ComponentType<{ size?: number; stroke?: number; className?: string }>;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { key: "employee", label: "Employee", path: "/employee", icon: IconUsers },
  { key: "expenses", label: "Expenses", path: "/expense", icon: IconFolder },
  {
    key: "expense_list",
    label: "Expense List",
    path: "/expense-list",
    icon: IconReceipt,
  },
];

type SidebarProps = {
  hasEmployee: boolean;
  hasExpenses: boolean;
  hasExpenseList: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({
  hasEmployee,
  hasExpenses,
  hasExpenseList,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.key === "employee") return hasEmployee;
    if (item.key === "expenses") return hasExpenses;
    if (item.key === "expense_list") return hasExpenseList;
    return false;
  });

  const baseLink =
    "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/10 hover:text-white";
  const activeLink = "bg-blue-500/20 text-blue-200";

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden bg-gray-900 text-gray-200 transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div
        className={`flex border-b border-white/10 ${
          collapsed
            ? "h-[70px] w-full flex-col items-center justify-center gap-2 px-3"
            : "items-center gap-2 px-4 py-5"
        }`}
      >
        {!collapsed && (
          <span className="whitespace-nowrap text-base font-bold text-white">
            Expense Management
          </span>
        )}
        <button
          type="button"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-gray-200 transition-colors hover:bg-white/20 ${
            collapsed ? "order-1 m-0" : "ml-auto"
          }`}
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>
      <nav
        className={`flex flex-col gap-1 ${
          collapsed ? "w-full items-center px-2 py-4" : "px-3 py-4"
        }`}
      >
        <NavLink
          to="/dashboard"
          end={false}
          className={({ isActive }) =>
            `${baseLink} ${isActive || location.pathname === "/" ? activeLink : ""}`
          }
        >
          <IconLayoutDashboard size={20} stroke={2} className="shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `${baseLink} ${isActive ? activeLink : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon size={20} stroke={2} className="shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
