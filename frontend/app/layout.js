import "./globals.css";

export const metadata = {
  title: "USHIKA | Banking Document Portal",
  description: "Demonstration banking document portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
