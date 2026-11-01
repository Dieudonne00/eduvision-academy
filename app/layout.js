import "./globals.css";

export const metadata = {
  title: "EduVision Academy",
  description: "Learn languages through audio and video lessons, quizzes and exams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
