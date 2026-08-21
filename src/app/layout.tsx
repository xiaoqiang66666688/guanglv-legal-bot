import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "广律在线 | 法律咨询助手",
    template: "%s | 广律在线",
  },
  description: "广律在线 - 专业法律咨询助手，免费初步法律分析，覆盖劳动、债务、婚姻、房产全领域",
  keywords: ["火山方舟", "豆包", "AI 智能体", "大模型", "对话助手"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}
