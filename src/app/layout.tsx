import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RdirAI - Claude & Kimi Style AI Workspace',
  description:
    'Web AI canggih seperti Claude dan Kimi dengan dukungan Live View Preview, OpenRouter Free Models, dan Database TiDB Cloud.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
        />
      </head>
      <body className="bg-kimi-bg text-gray-100 font-sans h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
