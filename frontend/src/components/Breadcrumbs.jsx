import Link from "next/link";
import "@/styles/SeoExtras.css";

export default function Breadcrumbs({ items = [] }) {
  if (items.length < 2) return null;
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`}>
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined}>
                  {item.name}
                </span>
              ) : (
                <Link href={item.href}>{item.name}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
