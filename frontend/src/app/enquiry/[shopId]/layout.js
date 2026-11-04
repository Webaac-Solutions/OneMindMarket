import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const shopId = params?.shopId;
  const canonical = shopId ? `${SITE_URL}/enquiry/${encodeURIComponent(shopId)}` : `${SITE_URL}/enquiry`;

  return {
    title: "Business Enquiry",
    description: "Submit an enquiry to connect with a business listed on OneMind Market.",
    alternates: { canonical },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
  };
}

export default function EnquiryLayout({ children }) {
  return children;
}
