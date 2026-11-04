export const FAQS = [
  {
    id: 1,
    question: "What is One Mind Market?",
    answer:
      "One Mind Market is a local business directory and networking platform for Vellore, Katpadi and nearby areas. It helps you find trusted local businesses and services, and helps native entrepreneurs get discovered by customers nearby.",
  },
  {
    id: 2,
    question: "How do I find a business near me?",
    answer:
      "Use the search box on the home page. Pick your location, choose a category such as Food & Bakery or Automobile Services, or type a business name, then tap Search. You can also open Business Listing to browse every business and filter the results.",
  },
  {
    id: 3,
    question: "Are the businesses listed on One Mind Market verified?",
    answer:
      "Every business listed is a member of the One Mind Market network. Members join through a request that our team reviews, so you are looking at businesses that are part of our community and not random listings.",
  },
  {
    id: 4,
    question: "How can I contact a business?",
    answer:
      "Open the business page and use the Call, WhatsApp or Send Enquiry buttons. The phone number, email and website on the page are also clickable, so you can reach the business directly in one tap.",
  },
  {
    id: 5,
    question: "Is it free for customers to use the website?",
    answer:
      "Yes. You can search businesses, view their details and contact them without creating an account.",
  },
  {
    id: 6,
    question: "How do I list my business on One Mind Market?",
    answer:
      "Tap Join as Member at the top of the page and fill in your name, mobile number, location and business category. Our team will review your details and contact you on the mobile number you provided.",
  },
  {
    id: 7,
    question: "Who can join as a member?",
    answer:
      "One Mind Market is made for native entrepreneurs who run and grow their own independent businesses. It is not meant for franchise chains or large corporate companies.",
  },
  {
    id: 8,
    question: "Can I save the businesses I like?",
    answer:
      "Yes. Use the Save button on a business to keep it in your saved list, so you can come back to it later without searching again.",
  },
  {
    id: 9,
    question: "How do I get updates about new announcements and offers?",
    answer:
      "Allow notifications when the Stay updated prompt appears, and use the bell icon in the header to see recent updates. All announcements are also listed on the Announcements page, linked in the footer.",
  },
  {
    id: 10,
    question: "My business details are wrong or I need help. Who do I contact?",
    answer:
      "Send us a message from the contact form on the About Us page with your contact number and what needs to change. Our team will get back to you.",
  },
  {
    id: 11,
    question: "How long does it take to hear back after I request to join?",
    answer:
      "Our team reviews every request and contacts you on the mobile number you provided within 24 hours.",
  },
  {
    id: 12,
    question: "What happens after I send an enquiry to a business?",
    answer:
      "The business reviews your enquiry and gets back to you on the number you gave, usually within 24 hours. If you need a faster reply, you can use the Call or WhatsApp button on the same business page.",
  },
  {
    id: 13,
    question: "Which areas does One Mind Market cover?",
    answer:
      "One Mind Market focuses on Vellore, Katpadi and the surrounding areas. You can pick your location in the search box to see businesses in your area.",
  },
  {
    id: 14,
    question: "What can I find in the Gallery and Articles sections?",
    answer:
      "The Gallery shows photos and videos from businesses in the network, and Articles has local business news and community content. Both are linked in the top menu.",
  },
  {
    id: 15,
    question: "Does the website work on my mobile phone?",
    answer:
      "Yes. One Mind Market works on mobile phones, tablets and computers, so you can search and contact businesses from any device.",
  },
];

export const HOME_FAQ_LIMIT = 10;

export const searchFaqs = (query) => {
  const q = (query || "").trim().toLowerCase();
  if (!q) return FAQS;
  return FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q),
  );
};
