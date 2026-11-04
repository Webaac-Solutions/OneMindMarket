import Link from "next/link";
import "@/styles/SearchResults.css";
import "@/styles/SeoExtras.css";

const hrefFor = (basePath, page) =>
  page <= 1 ? basePath : `${basePath}?page=${page}`;

function pageList(page, total) {
  const set = new Set([1, total, page - 1, page, page + 1]);
  const pages = [...set]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export default function Pagination({ basePath, page, totalPages }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <nav className="sr-pagination" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={hrefFor(basePath, page - 1)}
          className="sr-page-btn sr-page-arrow"
          rel="prev"
          aria-label="Previous page"
        >
          &lsaquo;
        </Link>
      )}
      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="sr-page-gap" aria-hidden="true">
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, p)}
            className={`sr-page-btn${p === page ? " sr-page-active" : ""}`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link
          href={hrefFor(basePath, page + 1)}
          className="sr-page-btn sr-page-arrow"
          rel="next"
          aria-label="Next page"
        >
          &rsaquo;
        </Link>
      )}
    </nav>
  );
}
