import Image from "next/image";
import AboutContactForm from "@/components/AboutContactForm";
import SeoJsonLd from "@/components/SeoJsonLd";
import AboutLoadGate from "@/components/AboutLoadGate";
import { SITE_URL } from "@/lib/api";
import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
import "@/styles/About.css";

export const metadata = {
  title: "About OneMind Market",
  description:
    "Learn how OneMind Market helps native entrepreneurs connect, collaborate, and gain digital visibility through trusted local business discovery.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: "About OneMind Market | Local Business Network",
    description:
      "Learn about OneMind Market, a referral-driven ecosystem for local entrepreneurs, independent businesses, and community collaboration.",
    url: `${SITE_URL}/about`,
    type: "website",
    siteName: "OneMind Market",
    locale: "en_IN",
    images: [
      {
        url: `${SITE_URL}/onemindlogo.png`,
        alt: "OneMind Market logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About OneMind Market | Local Business Network",
    description:
      "Learn about OneMind Market, a referral-driven ecosystem for local entrepreneurs and independent businesses.",
    images: [`${SITE_URL}/onemindlogo.png`],
  },
};

export default function AboutPage() {
  const url = `${SITE_URL}/about`;
  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "About OneMind Market", url },
  ]);
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildWebPageJsonLd({
        url,
        name: "About OneMind Market",
        description: metadata.description,
        breadcrumbs,
      }),
      breadcrumbs ? { ...breadcrumbs, "@id": `${url}#breadcrumb` } : null,
    ].filter(Boolean),
  };

  return (
    <div className="about-page">
      <SeoJsonLd data={pageJsonLd} />
      <AboutLoadGate />

      <section className="about-hero">
        <span className="eyebrow">Who We Are</span>
        <h1>ABOUT US</h1>
        <Image
          src="/onemindDesign.gif"
          alt="OneMind Market design and branding"
          width={480}
          height={270}
          unoptimized
          className="about-hero-gif"
        />
        <p className="about-tagline">
          A referral-driven search ecosystem rooted in trust, culture, and
          collaboration.
        </p>
      </section>

      <section className="about-section founder-section">
        <h2>FOUNDER'S MESSAGE</h2>
        <div className="founder-content">
          <p>
            At One Mind Market, my vision is to build a strong ecosystem where
            native entrepreneurs can connect, collaborate, and grow together. I
            believe that when local business owners support each other with
            trust, knowledge, and genuine opportunities, the entire business
            community becomes stronger.
          </p>
          <p>
            One Mind Market was created as a platform exclusively for native
            entrepreneurs. It is not designed for franchise chains or large
            corporate companies, but for independent business owners who are
            building and growing their own ventures.
          </p>
          <p>
            Our goal is to create a trusted community where entrepreneurs
            exchange business referrals, share knowledge, and help each other
            grow in a structured and meaningful way. Through the One Mind Market
            search engine, people can easily discover verified local businesses
            within our network.
          </p>
          <p>
            I strongly believe that empowering native entrepreneurs is the key
            to building a stronger and more self-reliant business community. One
            Mind Market is our step toward making that vision a reality.
          </p>
          <p className="founder-sign-off">
            Regards,
            <br />
            <strong>Suresh Bose</strong>
            <br />
            Founder &ndash; One Mind Market
          </p>
        </div>
      </section>

      <section className="about-section whatisomm-section">
        <h2>WHAT IS ONE MIND MARKET?</h2>
        <div className="whatisomm-content">
          <p>
            <strong>One Mind Market</strong> is a business networking, learning,
            and discovery platform created exclusively for native entrepreneurs
            who run and grow their own independent businesses. The purpose of
            the platform is to bring local business owners into one trusted
            ecosystem where they can connect, collaborate, and grow together.
          </p>
          <p>
            Within the community, entrepreneurs build strong professional
            relationships and support each other by sharing genuine business
            referrals. This creates consistent business opportunities and helps
            members expand their networks through trust and credibility. One
            Mind Market also focuses on entrepreneur development through
            dedicated knowledge-sharing sessions where members learn practical
            strategies, real business experiences, and growth insights from
            fellow entrepreneurs.
          </p>
          <p>
            To strengthen visibility for local businesses, the One Mind Market
            Search Engine allows people to easily discover verified businesses
            and services within the network. This helps customers find reliable
            local entrepreneurs while giving members a powerful digital
            presence.
          </p>
          <p>
            Unlike platforms that include large corporate companies or franchise
            chains, One Mind Market is designed only for native entrepreneurs
            who are building their own ventures. By supporting independent
            businesses and encouraging collaboration, the platform aims to
            strengthen the local economy, create more opportunities, and
            generate employment through the growth of native entrepreneurship.
          </p>
        </div>
      </section>

      <section
        id="contact-us"
        className="about-section contact-section"
        style={{ scrollMarginTop: 90 }}
      >
        <h2>CONTACT US</h2>
        <AboutContactForm />
      </section>
    </div>
  );
}
