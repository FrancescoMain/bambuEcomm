import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/ops/blog/PostEditor";

export const metadata: Metadata = { title: "Nuovo articolo" };

export default function NewPostPage() {
  return <PostEditor />;
}
