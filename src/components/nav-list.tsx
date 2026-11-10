import Link from 'next/link';

export type NavItem = { href: string; label: string; badge?: number };

/** Boczne menu (jak w prototypie): aktywna pozycja na granatowo, czerwone liczniki spraw do załatwienia. */
export function NavList({
  items,
  current,
  label,
  footer,
}: {
  items: NavItem[];
  current: string;
  label: string;
  footer?: React.ReactNode;
}) {
  return (
    <nav
      aria-label={label}
      className="no-print flex flex-[1_1_220px] flex-col gap-1 rounded-[10px] border border-line bg-white p-2 md:sticky md:top-6"
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3.5 text-base ${
                  active ? 'bg-navy font-semibold text-white' : 'text-ink hover:bg-page'
                }`}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className={`rounded-full px-2 text-[13px] font-bold ${active ? 'bg-white text-navy' : 'bg-accent text-white'}`}
                    aria-label={`${item.badge} do załatwienia`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {footer && <div className="mt-1.5 border-t border-[#EDF0F3] pt-1.5">{footer}</div>}
    </nav>
  );
}
