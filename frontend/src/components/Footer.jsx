"use client";

import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaLinkedinIn, FaPhone, FaEnvelope } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "@/styles/Footer.css";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <Image
                src="/onemindlogo.png"
                alt="OneMind Market logo"
                width={40}
                height={40}
                className="footer-logo-img"
              />
              <span className="footer-logo-text">ONE MIND MARKET</span>
            </Link>
            <p className="footer-desc">
              A trusted network connecting native entrepreneurs through
              referrals, community, and shared growth.
            </p>
            <div className="footer-contact">
              <a href="tel:+919677690666" className="footer-contact-link">
                <FaPhone /> +91 96776 90666
              </a>
              <a
                href="mailto:onemindmarketinfo@gmail.com"
                className="footer-contact-link"
              >
                <FaEnvelope /> onemindmarketinfo@gmail.com
              </a>
            </div>
            <div className="footer-socials">
              <a
                href="https://www.instagram.com/onemindmarket/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://x.com/OneMindMarket"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="X"
              >
                <FaXTwitter />
              </a>
              <a
                href="https://www.linkedin.com/in/one-mind-market-648538389/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>

          {/* Network */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Network</h4>
            <ul className="footer-link-list">
              <li>
                <Link href="/business-listing">Members Directory</Link>
              </li>
              <li>
                <Link href="/gallery">Gallery</Link>
              </li>
              <li>
                <Link href="/articles">Articles</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Connect</h4>
            <ul className="footer-link-list">
              <li>
                <Link href="/about#contact-us">Contact Support</Link>
              </li>
              <li>
                <Link href="/join">Join Member Program</Link>
              </li>
              <li>
                <Link href="/announcements">Announcements</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>
            &copy;{" "}
            <span suppressHydrationWarning>{new Date().getFullYear()}</span> ONE
            MIND MARKET. ALL RIGHTS RESERVED.
          </p>
          <div className="footer-legal">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
