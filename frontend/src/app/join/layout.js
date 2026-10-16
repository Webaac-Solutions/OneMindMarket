import { SITE_URL } from "@/lib/api";

export const metadata = {
  title: "Join OneMind Market",
  description:
    "Join OneMind Market and submit your local business to a trusted entrepreneur and business discovery network.",
  alternates: { canonical: `${SITE_URL}/join` },
  openGraph: {
    title: "Join OneMind Market | Local Business Network",
    description:
      "Join OneMind Market and connect your local business with a trusted entrepreneur and business discovery network.",
    url: `${SITE_URL}/join`,
    type: "website",
    siteName: "OneMind Market",
    locale: "en_IN",
    images: [{ url: `${SITE_URL}/onemindlogo.png`, alt: "OneMind Market logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join OneMind Market | Local Business Network",
    description:
      "Join OneMind Market and connect your local business with a trusted entrepreneur and business discovery network.",
    images: [`${SITE_URL}/onemindlogo.png`],
  },
};

export default function JoinLayout({ children }) {
  return children;
}
