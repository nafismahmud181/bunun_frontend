// Text for the legal pages. Payment gateways (SSLCommerz, bKash, Nagad) check these during
// merchant review, so fill in every section before applying.
//
// TO FILL IN: write each section's text as a list of paragraphs in `body`. A section with an
// empty body shows only its heading. Check the final wording with someone qualified; this file
// only gives the structure.

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalPage {
  title: string;
  /** Shown under the title, e.g. "Last updated 1 November 2026". */
  updated: string;
  sections: LegalSection[];
}

const section = (heading: string): LegalSection => ({ heading, body: [] });

export const LEGAL: Record<'privacy' | 'terms' | 'refund' | 'about', LegalPage> = {
  privacy: {
    title: 'Privacy Policy',
    updated: '',
    sections: [
      section('Information we collect'),
      section('How we use your information'),
      section('Who we share it with'),
      section('Cookies and similar technologies'),
      section('How long we keep your information'),
      section('Your choices and rights'),
      section('Contact us'),
    ],
  },
  terms: {
    title: 'Terms and Conditions',
    updated: '',
    sections: [
      section('About these terms'),
      section('Orders and confirmation'),
      section('Prices and payment'),
      section('Delivery'),
      section('Product colours and handmade variation'),
      section('Cancellations'),
      section('Limitation of liability'),
      section('Governing law'),
      section('Contact us'),
    ],
  },
  refund: {
    title: 'Refund and Return Policy',
    updated: '',
    sections: [
      section('Exchanges'),
      section('Returns'),
      section('Items that cannot be returned'),
      section('Damaged or wrong items'),
      section('Refunds'),
      section('How to start a return or exchange'),
    ],
  },
  about: {
    title: 'About Bunon',
    updated: '',
    sections: [section('Our story'), section('Our artisans'), section('Business details'), section('Contact us')],
  },
};
