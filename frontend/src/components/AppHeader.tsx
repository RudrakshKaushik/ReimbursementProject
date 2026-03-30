import React, { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconUser } from "@tabler/icons-react";
import { getAuthUsername } from "@/api/client";

type AppHeaderProps = {
  onLogout: () => void;
};

export function AppHeader({ onLogout }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  /** Same string as login API `username` (backend `user.username`). */
  const [username, setUsername] = useState(() => getAuthUsername());

  useEffect(() => {
    setUsername(getAuthUsername());
  }, []);

  const displayName = username?.trim() || "—";

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <header className="flex h-[70px] shrink-0 items-center justify-end bg-gray-900 px-8 py-4 text-white">
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          onClick={() => setOpen((v) => !v)}
        >
          <IconUser size={20} stroke={1.75} className="shrink-0 opacity-90" />
          <IconChevronDown
            size={18}
            stroke={1.75}
            className={`shrink-0 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-white/10 bg-gray-800 py-1 shadow-xl ring-1 ring-black/20"
          >
            <div className="border-b border-white/10 px-4 py-3" role="none">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Signed in as
              </p>
              <p className="mt-0.5 break-words text-sm font-semibold text-white">
                {displayName}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-sm text-red-300 transition hover:bg-white/10 hover:text-red-200"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
