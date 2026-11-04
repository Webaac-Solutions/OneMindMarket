import Image from "next/image";
import AboutContactForm from "@/components/AboutContactForm";
import SeoJsonLd from "@/components/SeoJsonLd";
import AboutLoadGate from "@/components/AboutLoadGate";
import { SITE_URL } from "@/lib/api";
import { buildBreadcrumbList, buildWebPageJsonLd } from "@/lib/seo";
import "@/styles/About.css";

const ABOUT_PILLARS = [
  {
    title: "Trusted Referrals",
    text: "Build trusted business relationships through genuine referrals, confident recommendations, and shared opportunities that help every entrepreneur grow.",
  },
  {
    title: "Learn, Share and Grow",
    text: "Learn, share, and grow together through practical insights, shared experiences, and knowledge that helps entrepreneurs overcome challenges and build stronger businesses.",
  },
  {
    title: "Local Visibility, Greater Opportunities",
    text: "Increase your business visibility with One Mind Market. Help customers discover your verified business, explore your services, and connect with you across categories and cities.",
  },
];

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

      {/* ABOUT US - client copy from the PDF */}
      <section className="about-section about-story-section">
        <h2>ONE MIND MARKET &ndash; WHERE LOCAL BUSINESSES GROW TOGETHER</h2>
        <div className="about-story">
          <p>
            Every business has a story. A dream that started small, years of
            hard work, countless challenges, and a person who never gave up on
            building something of their own.
          </p>
          <p className="about-bold">
            One Mind Market was created for these people - our native
            entrepreneurs, independent business owners, and local dreamers who
            work every day to turn their passion into progress.
          </p>
          <p>
            We help businesses improve their visibility, reach more customers,
            discover new opportunities, and learn from one another through a
            trusted network and local business directory.
          </p>
          <p>
            Our mission is to strengthen local businesses, empower
            entrepreneurs, and build thriving communities where success is
            shared.
          </p>
        </div>

        <ul className="about-pillars">
          {ABOUT_PILLARS.map((pt) => (
            <li key={pt.title}>
              <h3>{pt.title}</h3>
              <p>{pt.text}</p>
            </li>
          ))}
        </ul>

        <div className="about-impact">
          <h3>Growing Businesses. Strengthening Communities.</h3>
          <p>
            We aim to strengthen local economies by helping entrepreneurs
            support one another, create opportunities, generate jobs, and build
            a brighter future for their communities.
          </p>
          <p>
            Because behind every small business is a family, a dream, and a
            future worth supporting.
          </p>
          <p>
            We believe that when we choose to support local entrepreneurs, we
            are not just helping a business grow - we are helping an entire
            community move forward.
          </p>
          <p className="about-impact-tagline">
            One Mind Market. Search. Discover. Connect. Support. Grow.
          </p>
          <p className="about-bold">
            Together, let&apos;s build a future where no native entrepreneur has
            to grow alone.
          </p>
        </div>
      </section>

      {/* FOUNDER MESSAGE - replaced with PDF copy */}
      <section className="about-section founder-section">
        <h2>A MESSAGE FROM OUR FOUNDER</h2>
        <div className="founder-content">
        <figure className="founder-photo">
          <Image
            src="/founder-suresh-bose.jpg"
            alt="Suresh Bose, Founder of One Mind Market"
            width={800}
            height={1000}
            sizes="(max-width: 600px) 75vw, 300px"
            className="founder-photo-img"
          />
        </figure>
          <p>
            During my journey in Vellore, I realized that many talented
            entrepreneurs were working hard but growing alone. They had the
            skills and determination to succeed, but needed the right network,
            support, and opportunities.
          </p>
          <p>
            My journey through media, community building, digital marketing,
            and business strategy inspired me to create{" "}
            <strong>One Mind Market in 2024</strong> - a platform where
            independent business owners can build trusted relationships,
            exchange referrals, share knowledge, and grow together.
          </p>
          <p>
            Our mission is to strengthen local businesses, improve their
            visibility, and create opportunities through collaboration. I
            believe that when entrepreneurs support one another, they build
            more than successful businesses - they build stronger communities
            and a lasting legacy.
          </p>
          <p>
            Our goal is to empower <strong>1,000 entrepreneurs</strong> to
            discover new opportunities and transform their businesses.
          </p>
          <p className="about-bold">
            One Mind Market is more than a platform. It is a movement to help
            entrepreneurs stop growing alone and start growing together.
          </p>
          <p className="founder-italic">
            Let&apos;s connect, collaborate, and build a better future -
            together.
          </p>
          <p className="founder-sign-off">
            Warm regards,
            <br />
            <strong>Suresh Bose</strong>
            <br />
            Founder, One Mind Market
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
