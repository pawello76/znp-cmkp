import Link from 'next/link';

const ITEMS = [
  { href: '/', label: 'Pulpit' },
  { href: '/legitymacja', label: 'Legitymacja' },
  { href: '/zmiana-hasla', label: 'Zmiana hasła' },
];

export function MemberNav({ current }: { current: string }) {
  return (
    <nav aria-label="Menu członka" className="no-print border-b border-line bg-white">
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
