import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata = {
  title: 'CRM Portal',
  description: 'Internal CRM — Contacts, Tasks, Delivery Messaging & Analytics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body cz-shortcut-listen="true" className={dmSans.className}>{children}</body>
    </html>
  );
}
