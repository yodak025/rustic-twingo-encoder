import "./globals.css";

export const metadata = {
  title: "Rustic Twingo Encoder",
  description: "Audio transcoding with ffmpeg",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
