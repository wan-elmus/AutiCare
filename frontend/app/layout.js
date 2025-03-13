import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { WebSocketProvider } from '@/context/WebSocketContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AutiCare",
  description: "Empowering children with autism through compassionate monitoring and data-driven insights.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <UserProvider>
            <WebSocketProvider>
            {children}
            </WebSocketProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}