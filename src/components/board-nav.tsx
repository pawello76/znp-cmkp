import Link from 'next/link';

const ITEMS = [
  { href: '/zarzad', label: 'Członkowie i konta' },
  { href: '/zarzad/aktualnosci', label: 'Aktualności' },
  { href: '/zarzad/dokumenty', label: 'Dokumenty' },
  { href: '/zarzad/wydarzenia', label: 'Wydarzenia' },
];

export function BoardNav({ current }: { current: string }) {
  return (
    <nav aria-label="Menu zarządu" className="border-b border-line bg-white">
      <ul className="mx-auto flex max-w-[1360px] flex-wrap gap-1 px-6">
        {ITEMS.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-[44px] items-center border-b-[3px] px-3 font-semibold ${
                  active ? 'border-navy text-navy' : 'border-transparent text-ink-soft hover:text-navy'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
