import "./globals.css";
import SiteHeader from "./site-header";

export const metadata = {
  title: "EduVision Academy",
  description: "Learn languages through audio and video lessons, quizzes and exams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
