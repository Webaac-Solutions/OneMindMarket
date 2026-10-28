"use client";

import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { searchFaqs } from "@/lib/faqs";
import "@/styles/Faq.css";

export default function FaqClient({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const results = searchFaqs(query);

  return (
    <>
      <div className="faq-search">
        <FiSearch size={18} className="faq-search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions..."
          aria-label="Search questions"
        />
      </div>
      <div className="faq-list">
        {results.length === 0 ? (
          <p className="faq-empty">No matching questions found.</p>
        ) : (
          results.map((f) => (
            <div key={f.id} className="faq-item">
              <p className="faq-q">
                <span className="faq-label">Q:</span> {f.question}
              </p>
              <p className="faq-a">
                <span className="faq-label">A:</span> {f.answer}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
