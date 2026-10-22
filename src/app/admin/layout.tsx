import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · D4DX admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
