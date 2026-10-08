import type { Metadata } from "next";
import { PostsView } from "@/components/admin/ops/blog/PostsView";

export const metadata: Metadata = { title: "Blog" };

export default function BlogAdminPage() {
  return <PostsView />;
}
