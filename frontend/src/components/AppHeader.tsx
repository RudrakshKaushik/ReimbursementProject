import React from "react";

type AppHeaderProps = {
  onLogout: () => void;
};

export function AppHeader({ onLogout }: AppHeaderProps) {
  return (
    <header className="flex h-[70px] shrink-0 items-center justify-end bg-gray-900 px-8 py-4 text-white">
      <button
        type="button"
        className="cursor-pointer rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        onClick={onLogout}
      >
        Logout
      </button>
    </header>
  );
}

export default AppHeader;
