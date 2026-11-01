import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import "./globals.css";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Lora({ subsets: ["latin"], style: ["italic"], variable: "--font-serif", display: "swap" });

export const metadata = {
  metadataBase: new URL("https://eduvisionacademy.com"),
  title: {
    default: "EduVision Academy · Learn languages & skills online",
    template: "%s · EduVision Academy",
  },
  description:
    "Learn English, French, Swahili, Chinese, photography and traffic rules through audio and video lessons, quizzes marked instantly and exams. Kigali, Rwanda.",
  openGraph: {
    title: "EduVision Academy",
    description: "Come to learn, Go to serve. Audio & video lessons, quizzes and exams.",
    images: ["/images/class-photography.webp"],
  },
};

export const viewport = { themeColor: "#21728A" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
