export const metadata = {
  title: "NOMAD Demo",
  description: "AI lead qualification demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
