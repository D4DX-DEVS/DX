import type { Metadata, Viewport } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · D4DX admin" },
  robots: { index: false, follow: false },
};

// The admin is light; the root layout's dark theme colour would tint the browser's address bar.
export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

/** `.admin-root` is what admin.css keys the light theme on (see there); `contents` keeps it out of the layout. */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="admin-root contents">{children}</div>;
}
