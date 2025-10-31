'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Where2Meet</h3>
            <p className="text-sm leading-relaxed">
              Find the perfect meeting place for your group. Coordinate locations, discover nearby venues, and meet in the middle.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="mr-2">📧</span>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Email</div>
                  <a
                    href="mailto:contact@where2meet.app"
                    className="hover:text-white transition-colors"
                  >
                    contact@where2meet.app
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📞</span>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Phone</div>
                  <a
                    href="tel:+15555551234"
                    className="hover:text-white transition-colors"
                  >
                    +1 (555) 555-1234
                  </a>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🏢</span>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Support</div>
                  <a
                    href="mailto:support@where2meet.app"
                    className="hover:text-white transition-colors"
                  >
                    support@where2meet.app
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p>
            &copy; {currentYear} Where2Meet. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
