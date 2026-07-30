export type AppIconName =
  'archive' | 'conversation' | 'evolution' | 'map' | 'presence' | 'settings';

export function AppIcon({ name }: { name: AppIconName }): React.JSX.Element {
  const pathByName: Record<AppIconName, React.JSX.Element> = {
    archive: (
      <>
        <path d="M5 8.5h14v10.25A1.25 1.25 0 0 1 17.75 20H6.25A1.25 1.25 0 0 1 5 18.75V8.5Z" />
        <path d="M4 4h16v4.5H4zM9.25 12h5.5" />
      </>
    ),
    conversation: (
      <>
        <path d="M5.5 5.25h13A1.5 1.5 0 0 1 20 6.75v8.5a1.5 1.5 0 0 1-1.5 1.5H11l-4.75 3v-3H5.5A1.5 1.5 0 0 1 4 15.25v-8.5a1.5 1.5 0 0 1 1.5-1.5Z" />
        <path d="M8 9h8M8 12.5h5" />
      </>
    ),
    evolution: (
      <>
        <path d="M6 18V8.5M12 18V5M18 18v-7" />
        <circle cx="6" cy="7" r="1.5" />
        <circle cx="12" cy="3.5" r="1.5" />
        <circle cx="18" cy="9.5" r="1.5" />
        <path d="m7.25 6.25 3.5-1.75M13.3 4.2l3.4 4.6" />
      </>
    ),
    map: (
      <>
        <circle cx="6" cy="7" r="2" />
        <circle cx="17.5" cy="5.5" r="1.5" />
        <circle cx="15.5" cy="17.5" r="2" />
        <circle cx="5.5" cy="17" r="1.25" />
        <path d="m7.8 6.4 8.2-.7M7.2 8.5l7.1 7.4M7 17.1l6.5.3" />
      </>
    ),
    presence: (
      <>
        <circle cx="12" cy="12" r="2.5" />
        <circle cx="12" cy="12" r="7" />
        <path d="M12 2.5V5M21.5 12H19M12 19v2.5M5 12H2.5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.65 5.65l1.4 1.4M16.95 16.95l1.4 1.4M18.35 5.65l-1.4 1.4M7.05 16.95l-1.4 1.4" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="app-icon" viewBox="0 0 24 24">
      {pathByName[name]}
    </svg>
  );
}
