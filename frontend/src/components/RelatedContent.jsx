import Link from "next/link";
import Image from "next/image";
import "@/styles/SeoExtras.css";

export default function RelatedContent({ heading, items = [], viewAll }) {
  if (items.length === 0) return null;
  return (
    <section className="related" aria-labelledby="related-heading">
      <h2 id="related-heading">{heading}</h2>
      <ul className="related-grid">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="related-card">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.title}
                  width={400}
                  height={225}
                  sizes="(max-width: 640px) 100vw, 300px"
                />
              )}
              <span className="related-title">{item.title}</span>
              {item.excerpt && (
                <span className="related-excerpt">{item.excerpt}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {viewAll && (
        <Link href={viewAll.href} className="related-all">
          {viewAll.label}
        </Link>
      )}
    </section>
  );
}
