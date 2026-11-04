// FAQ-OFF: stub below keeps /faq returning 404 (a page.jsx needs a default export).
// To restore: delete this stub (lines 1-9), then select all and Ctrl+/ to uncomment the rest.
import { notFound } from "next/navigation";

export default function FaqPage() {
  notFound();
}

// ----- original page (commented out) -----
// import PageHeading from "@/components/PageHeading";
// import FaqClient from "@/components/FaqClient";
// import SeoJsonLd from "@/components/SeoJsonLd";
// import { FAQS } from "@/lib/faqs";
// import { SITE_URL } from "@/lib/api";
// import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
// import "@/styles/Faq.css";
//
// export const metadata = {
//   title: "Frequently Asked Questions",
//   description:
//     "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
//   alternates: { canonical: `${SITE_URL}/faq` },
//   openGraph: {
//     title: "Frequently Asked Questions | OneMind Market",
//     description:
//       "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
//     url: `${SITE_URL}/faq`,
//     type: "website",
//     siteName: "OneMind Market",
//     locale: "en_IN",
//     images: [
//       { url: `${SITE_URL}/onemindlogo.png`, alt: "OneMind Market logo" },
//     ],
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "Frequently Asked Questions | OneMind Market",
//     description:
//       "Answers to common questions about OneMind Market, the native entrepreneur network and local business directory.",
//     images: [`${SITE_URL}/onemindlogo.png`],
//   },
// };
//
// export default function FaqPage({ searchParams }) {
//   const q = typeof searchParams?.q === "string" ? searchParams.q : "";
//   const url = `${SITE_URL}/faq`;
//   const breadcrumbs = buildBreadcrumbList([
//     { name: "Home", url: SITE_URL },
//     { name: "FAQ", url },
//   ]);
//   const faqJsonLd = {
//     "@context": "https://schema.org",
//     "@graph": [
//       buildWebPageJsonLd({
//         url,
//         name: "Frequently Asked Questions",
//         description: metadata.description,
//         type: "FAQPage",
//         breadcrumbs,
//         mainEntity: { "@id": `${url}#faq` },
//       }),
//       {
//         "@type": "FAQPage",
//         "@id": `${url}#faq`,
//         mainEntity: FAQS.map((f) => ({
//           "@type": "Question",
//           name: f.question,
//           acceptedAnswer: { "@type": "Answer", text: f.answer },
//         })),
//       },
//       breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
//     ].filter(Boolean),
//   };
//
//   return (
//     <div className="faq-page">
//       <SeoJsonLd data={faqJsonLd} />
//       <PageHeading
//         eyebrow="Help"
//         title="Frequently Asked Questions"
//         subtitle="Everything you need to know about OneMind Market"
//       />
//       <FaqClient key={q} initialQuery={q} />
//     </div>
//   );
// }

/*
==================== HOW TO TURN FAQ BACK ON ====================
Tip: search the whole project for "FAQ-OFF" to jump to every spot.
Line numbers are as of when FAQ was commented out.
Uncomment = select the lines, press Ctrl+/ (comment toggle).

1. THIS FILE (app/faq/page.jsx)
   - delete lines 1-9 (header + notFound stub)
   - select lines 10-86 (original page), Ctrl+/
   - then delete this guide block (everything from the line after 86)

2. components/FaqClient.jsx
   - delete line 1 (header note)
   - select all, Ctrl+/

3. lib/faqs.js
   - delete line 1 (header note)
   - select all, Ctrl+/

4. components/HomeClient.jsx  (3 spots)
   a) lines 19-21: delete the note line 19, uncomment lines 20-21 (2 imports)
   b) lines 54-57: delete the note line 54, uncomment lines 55-57 (faq state)
   c) lines 544-599: delete line 544 (opening comment, the one saying
      FAQ-OFF 3/3) and line 599 (closing comment-end line). The section
      between them then renders again.

5. components/Footer.jsx
   - lines 85-89: delete line 85 (opening comment) and line 89 (closing
     comment-end line). The FAQ link shows again.

6. app/sitemap.xml/route.js  line 12: uncomment "/faq"
7. app/[locationSlug]/page.jsx  line 27: uncomment "faq"
8. backend/routes/seoRoutes.js  line 84: uncomment the appendUrl line

styles/Faq.css was never changed (it only loads once step 4a is done).
After restoring: run a build and resubmit the sitemap in Search Console.
=================================================================
*/
  