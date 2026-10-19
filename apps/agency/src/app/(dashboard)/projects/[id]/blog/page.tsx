"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  FileText,
  Plus,
  ArrowLeft,
  CheckCircle2,
  GitPullRequest,
  Calendar,
  User,
  Edit2,
} from "lucide-react";

export default function BlogStudioPage() {
  const params = useParams();
  const projectId = params.id as any;

  const project = useQuery(api.projects.get, { projectId });
  const posts = useQuery(api.blog.listByProject, { projectId });
  const createPost = useMutation(api.blog.create);
  const updatePost = useMutation(api.blog.update);
  const stageForGitPR = useMutation(api.blog.stageForGitPR);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    author: "",
    category: "General",
    tagsString: "",
    coverImageUrl: "",
    seoTitle: "",
    seoDescription: "",
    markdownContent: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stagedToast, setStagedToast] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500 animate-pulse text-sm">Loading Blog Studio...</div>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingPostId(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      author: "Orifa Editorial",
      category: "Technology",
      tagsString: "design, tech",
      coverImageUrl: "",
      seoTitle: "",
      seoDescription: "",
      markdownContent: "# Article Title\n\nWrite your blog content in markdown here...",
    });
    setIsEditorOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug,
    }));
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const tags = formData.tagsString
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingPostId) {
        await updatePost({
          postId: editingPostId,
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt,
          author: formData.author,
          category: formData.category,
          tags,
          coverImageUrl: formData.coverImageUrl || undefined,
          seoTitle: formData.seoTitle || undefined,
          seoDescription: formData.seoDescription || undefined,
          markdownContent: formData.markdownContent,
        });
      } else {
        await createPost({
          projectId,
          title: formData.title,
          slug: formData.slug,
          excerpt: formData.excerpt,
          author: formData.author,
          category: formData.category,
          tags,
          coverImageUrl: formData.coverImageUrl || undefined,
          seoTitle: formData.seoTitle || undefined,
          seoDescription: formData.seoDescription || undefined,
          markdownContent: formData.markdownContent,
        });
      }
      setIsEditorOpen(false);
    } catch (err: any) {
      alert("Error saving blog article: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStageForPR = async (postId: any, title: string) => {
    try {
      await stageForGitPR({ postId });
      setStagedToast(`Article "${title}" staged for Git Pull Request!`);
      setTimeout(() => setStagedToast(null), 4000);
    } catch (err: any) {
      alert("Error staging article: " + err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/projects"
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sites
            </Link>
            <span className="text-zinc-400 dark:text-zinc-600">/</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-blue-500" />
            Content Collection &amp; Blog Studio
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Author structured articles with Astro/Next.js YAML frontmatter and stage them directly into Git collections.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Article
        </button>
      </div>

      {/* Staged Toast Alert */}
      {stagedToast && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{stagedToast}</span>
          <Link
            href={`/projects/${projectId}/changes`}
            className="ml-auto underline font-medium hover:text-emerald-950 dark:hover:text-white"
          >
            Go to Review Queue &rarr;
          </Link>
        </div>
      )}

      {/* Posts List */}
      {posts === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/20 p-8 shadow-xs">
          <FileText className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-200">No blog articles yet</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Create structured articles with SEO metadata, tags, and markdown for your client&apos;s Astro or Next.js blog.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Write First Article
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">{post.title}</h3>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                    {post.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      post.status === "pending_review"
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
                        : post.status === "pr_created"
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {post.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">{post.excerpt}</p>

                <div className="flex items-center gap-4 text-[11px] text-zinc-500 pt-1">
                  <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-400">
                    slug: /{post.slug}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingPostId(post._id);
                    setFormData({
                      title: post.title,
                      slug: post.slug,
                      excerpt: post.excerpt,
                      author: post.author,
                      category: post.category,
                      tagsString: post.tags.join(", "),
                      coverImageUrl: post.coverImageUrl || "",
                      seoTitle: post.seoTitle || "",
                      seoDescription: post.seoDescription || "",
                      markdownContent: post.markdownContent,
                    });
                    setIsEditorOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>

                <button
                  onClick={() => handleStageForPR(post._id, post.title)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm cursor-pointer"
                >
                  <GitPullRequest className="h-3.5 w-3.5" />
                  Stage for PR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Article Studio Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                {editingPostId ? "Edit Article" : "Create Blog Article"}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Slug / URL Path *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Excerpt / Summary *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Author, Category, Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tagsString}
                    onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Cover Image & SEO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cover Image Path</label>
                  <input
                    type="text"
                    placeholder="/images/uploads/cover.webp"
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">SEO Title (Optional)</label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Markdown Content */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Markdown Content *
                </label>
                <textarea
                  rows={10}
                  required
                  value={formData.markdownContent}
                  onChange={(e) => setFormData({ ...formData, markdownContent: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
