import type { ReactNode } from 'react';

import { copy } from '../copy';
import { Tooltip } from '../design-system';
import { AppIcon, type AppIconName } from './AppIcon';

interface NavigationItem {
  readonly route?: 'conversation' | 'presence';
  readonly icon: AppIconName;
  readonly label: string;
}

const futureNavigation = [
  { icon: 'map', label: copy.navigation.map },
  { icon: 'evolution', label: copy.navigation.evolution },
  { icon: 'archive', label: copy.navigation.archive },
] as const satisfies readonly NavigationItem[];

function UnavailableNavigationItem({ icon, label }: NavigationItem): React.JSX.Element {
  return (
    <li>
      <Tooltip content={`${label}：${copy.navigation.unavailableDescription}`} placement="bottom">
        <span className="app-nav__disabled-wrapper">
          <button
            aria-describedby={`nav-${label}-availability`}
            className="app-nav__item app-nav__item--disabled"
            disabled
            type="button"
          >
            <AppIcon name={icon} />
            <span className="app-nav__text">
              <span>{label}</span>
              <small id={`nav-${label}-availability`}>{copy.navigation.unavailable}</small>
            </span>
          </button>
        </span>
      </Tooltip>
    </li>
  );
}

function AvailableNavigationItem({
  active,
  icon,
  label,
  route,
  secondary,
}: NavigationItem & {
  active: boolean;
  route: 'conversation' | 'presence';
  secondary: string;
}): React.JSX.Element {
  return (
    <li>
      <a
        aria-current={active ? 'page' : undefined}
        className={`app-nav__item${active ? ' app-nav__item--active' : ''}`}
        href={`#/${route}`}
      >
        <AppIcon name={icon} />
        <span className="app-nav__text">
          <span>{label}</span>
          <small>{secondary}</small>
        </span>
      </a>
    </li>
  );
}

export function AppShell({
  activeRoute,
  children,
}: {
  activeRoute: 'conversation' | 'presence';
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="app-shell">
      <aside className="app-shell__rail">
        <div className="app-brand" aria-label={`${copy.app.name}，${copy.app.descriptor}`}>
          <span className="app-brand__mark" aria-hidden="true">
            J
          </span>
          <span className="app-brand__copy">
            <strong>{copy.app.name}</strong>
            <small>{copy.app.descriptor}</small>
          </span>
        </div>

        <nav aria-label={copy.navigation.label} className="app-nav">
          <ul>
            <AvailableNavigationItem
              active={activeRoute === 'presence'}
              icon="presence"
              label={copy.navigation.current}
              route="presence"
              secondary="Presence"
            />
            <AvailableNavigationItem
              active={activeRoute === 'conversation'}
              icon="conversation"
              label={copy.navigation.conversation}
              route="conversation"
              secondary="Conversation"
            />
            {futureNavigation.map((item) => (
              <UnavailableNavigationItem {...item} key={item.label} />
            ))}
          </ul>
        </nav>

        <ul className="app-shell__settings">
          <UnavailableNavigationItem icon="settings" label={copy.navigation.settings} />
        </ul>
      </aside>
      <div className="app-shell__content">{children}</div>
    </div>
  );
}
