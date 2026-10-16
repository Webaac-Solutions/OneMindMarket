"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";
import NotificationBell from "@/components/NotificationBell";
import "@/styles/Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    startTransition(() => {
      router.push(`/business-listing${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    });
    setSearchOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="header-logo" aria-label="OneMind Market home">
          <Image
            src="/onemindlogo.png"
            alt=""
            width={40}
            height={40}
            className="header-logo-img"
            priority
          />
          <span className="header-logo-text">
            <span className="header-logo-text-main">ONE MIND</span>
            <span className="header-logo-text-sub">MARKET</span>
          </span>
        </Link>

        <nav className={`header-nav ${menuOpen ? "header-nav--open" : ""}`}>
          <Link
            href="/"
            className={`header-nav-link ${isActive("/") ? "header-nav-link--active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/business-listing"
            className={`header-nav-link ${isActive("/business-listing") ? "header-nav-link--active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Business Listing
          </Link>
          <Link
            href="/gallery"
            className={`header-nav-link ${isActive("/gallery") ? "header-nav-link--active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link
            href="/articles"
            className={`header-nav-link ${isActive("/articles") ? "header-nav-link--active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Articles
          </Link>
          <Link
            href="/about"
            className={`header-nav-link ${isActive("/about") ? "header-nav-link--active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            About Us
          </Link>
        </nav>

        <div className="header-actions">
          <form
            className="header-search-form header-search-form--desktop"
            onSubmit={handleSearchSubmit}
          >
            {isPending ? (
              <span className="btn-spinner header-search-icon" />
            ) : (
              <FiSearch className="header-search-icon" size={16} />
            )}
            <input
              type="text"
              className="header-search-input"
              placeholder="Search businesses..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>

          <NotificationBell />

          <button
            type="button"
            className={`header-search-toggle ${searchOpen ? "header-search-toggle--open" : ""}`}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            {searchOpen ? <FiX size={18} /> : <FiSearch size={18} />}
          </button>

          <Link href="/join" className="header-join-btn">
            <span className="header-join-full">Join as Member</span>
            <span className="header-join-short">Join</span>
          </Link>
          <button
            className={`header-menu-btn ${menuOpen ? "header-menu-btn--open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="header-menu-line" />
            <span className="header-menu-line" />
            <span className="header-menu-line" />
          </button>
        </div>

        {searchOpen && (
          <form
            className="header-search-form header-search-form--expanded"
            onSubmit={handleSearchSubmit}
          >
            {isPending ? (
              <span className="btn-spinner header-search-icon" />
            ) : (
              <FiSearch className="header-search-icon" size={16} />
            )}
            <input
              type="text"
              className="header-search-input"
              placeholder="Search businesses..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
          </form>
        )}
      </div>
    </header>
  );
};

export default Header;
