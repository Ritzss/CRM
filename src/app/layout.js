import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400','500','600','700'] });

export const metadata = {
  title: { default: 'CRM Portal', template: '%s | CRM Portal' },
  description: 'Internal CRM — Contacts, Deals, Tasks, Messages & Analytics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={dmSans.className}  cz-shortcut-listen="true">{children}</body>
    </html>
  );
}
