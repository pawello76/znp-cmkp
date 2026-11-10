import Link from 'next/link';

export type NavItem = { href: string; label: string; badge?: number };

/** Wspólny pasek zakładek (członek i zarząd) z licznikami „do załatwienia”. */
export function NavList({ items, current, label }: { items: NavItem[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="no-print border-b border-line bg-white">
      <ul className="mx-auto flex max-w-[1360px] flex-wrap gap-1 px-6">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[44px] items-center gap-1.5 border-b-[3px] px-3 font-semibold ${
                  active ? 'border-navy text-navy' : 'border-transparent text-ink-soft hover:text-navy'
                }`}
              >
                {item.label}
                {item.badge ? (
                  <span className="rounded-full bg-accent px-2 text-xs font-bold text-white" aria-label={`${item.badge} do załatwienia`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
