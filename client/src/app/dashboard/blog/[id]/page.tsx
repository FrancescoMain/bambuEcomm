import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/ops/blog/PostEditor";

export const metadata: Metadata = { title: "Modifica articolo" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (!Number.isFinite(postId) || postId <= 0) notFound();
  return <PostEditor key={postId} postId={postId} />;
}
