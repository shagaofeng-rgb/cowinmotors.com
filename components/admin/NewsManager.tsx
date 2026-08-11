"use client";

import { useMemo, useState } from "react";
import type { NewsArticle } from "@/lib/news";

type FormState = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  coverImageUrl: string;
  coverImageAlt: string;
  authorName: string;
  status: "draft" | "review_required" | "published" | "archived";
  indexable: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  sourceTitle: string;
  sourcePublisher: string;
  sourceAuthor: string;
  sourceUrl: string;
  editorialNote: string;
  productIds: string;
};

const blankForm = (): FormState => ({
  id: "", title: "", content: "", excerpt: "", category: "Automotive Parts Insights", tags: "", coverImageUrl: "", coverImageAlt: "",
  authorName: "Cowinmotors Editorial Team", status: "draft", indexable: false, publishedAt: new Date().toISOString().slice(0, 16),
  seoTitle: "", seoDescription: "", sourceTitle: "Cowinmotors original editorial content", sourcePublisher: "Cowinmotors Automotive Parts",
  sourceAuthor: "", sourceUrl: "", editorialNote: "", productIds: "",
});

function formFromArticle(article: NewsArticle): FormState {
  return {
    id: article.id, title: article.title, content: article.content, excerpt: article.excerpt, category: article.category, tags: article.tags.join(", "),
    coverImageUrl: article.coverImageUrl, coverImageAlt: article.coverImageAlt, authorName: article.authorName, status: article.status,
    indexable: article.indexable, publishedAt: article.publishedAt.slice(0, 16), seoTitle: article.seoTitle, seoDescription: article.seoDescription,
    sourceTitle: article.sourceTitle, sourcePublisher: article.sourcePublisher, sourceAuthor: article.sourceAuthor, sourceUrl: article.sourceUrl,
    editorialNote: article.editorialNote, productIds: article.products.map((product) => product.productId).join(", "),
  };
}

export function NewsManager({ initialArticles }: { initialArticles: NewsArticle[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [form, setForm] = useState<FormState>(blankForm);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const legacyCount = useMemo(() => articles.filter((article) => !article.indexable).length, [articles]);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNote("");
    const payload = { ...form, productIds: form.productIds.split(",").map((id) => id.trim()).filter(Boolean), tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
    const response = await fetch("/api/admin/news", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNote(result.error || "Unable to save the article.");
    } else {
      const article = result.article as NewsArticle;
      setArticles((current) => [article, ...current.filter((item) => item.id !== article.id)]);
      setForm(blankForm());
      setNote(article.status === "published" ? "Article saved and published by editorial action." : "Article saved for editorial review.");
    }
    setSaving(false);
  }

  async function removeArticle(id: string) {
    if (!window.confirm("Delete this News article permanently?")) return;
    const response = await fetch("/api/admin/news", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setNote(result.error || "Unable to delete the article."); return; }
    setArticles((current) => current.filter((item) => item.id !== id));
    if (form.id === id) setForm(blankForm());
    setNote("Article deleted. Sitemap has been marked for manual refresh.");
  }

  return (
    <div className="admin-stack">
      <section className="admin-metric-grid">
        <div className="admin-metric"><span>Published</span><strong>{articles.filter((article) => article.status === "published" && article.indexable).length}</strong><small>可进入 sitemap</small></div>
        <div className="admin-metric"><span>Draft / review</span><strong>{articles.filter((article) => article.status !== "published").length}</strong><small>等待人工处理</small></div>
        <div className="admin-metric"><span>Legacy noindex</span><strong>{legacyCount}</strong><small>保留 URL，不参与收录</small></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-headline"><div><p className="eyebrow">Manual editorial workflow</p><h2>{form.id ? "编辑新闻" : "新建新闻"}</h2></div><button className="admin-secondary-button" onClick={() => setForm(blankForm())} type="button">新建草稿</button></div>
        <form className="admin-form-grid" onSubmit={save}>
          <label>Title<input value={form.title} onChange={(event) => set("title", event.target.value)} required /></label>
          <label>Category<input value={form.category} onChange={(event) => set("category", event.target.value)} required /></label>
          <label>Author<input value={form.authorName} onChange={(event) => set("authorName", event.target.value)} required /></label>
          <label>Status<select value={form.status} onChange={(event) => set("status", event.target.value as FormState["status"])}><option value="draft">Draft</option><option value="review_required">Review required</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <label>Publish date<input type="datetime-local" value={form.publishedAt} onChange={(event) => set("publishedAt", event.target.value)} /></label>
          <label>Tags<input value={form.tags} onChange={(event) => set("tags", event.target.value)} placeholder="fitment, sourcing" /></label>
          <label className="wide">Excerpt<textarea rows={3} value={form.excerpt} onChange={(event) => set("excerpt", event.target.value)} /></label>
          <label className="wide">Article content<textarea rows={12} value={form.content} onChange={(event) => set("content", event.target.value)} required /></label>
          <label>Cover image URL<input type="url" value={form.coverImageUrl} onChange={(event) => set("coverImageUrl", event.target.value)} placeholder="https://" /></label>
          <label>Cover image alt<input value={form.coverImageAlt} onChange={(event) => set("coverImageAlt", event.target.value)} /></label>
          <label>Source title<input value={form.sourceTitle} onChange={(event) => set("sourceTitle", event.target.value)} /></label>
          <label>Source publisher<input value={form.sourcePublisher} onChange={(event) => set("sourcePublisher", event.target.value)} /></label>
          <label>Source author<input value={form.sourceAuthor} onChange={(event) => set("sourceAuthor", event.target.value)} /></label>
          <label>Source URL<input type="url" value={form.sourceUrl} onChange={(event) => set("sourceUrl", event.target.value)} placeholder="https://" /></label>
          <label className="wide">Related product IDs / slugs<input value={form.productIds} onChange={(event) => set("productIds", event.target.value)} placeholder="Comma-separated product IDs or slugs, selected manually" /></label>
          <label>SEO title<input value={form.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} /></label>
          <label>SEO description<input value={form.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} /></label>
          <label className="wide">Editorial review note<textarea rows={3} value={form.editorialNote} onChange={(event) => set("editorialNote", event.target.value)} placeholder="Why this article is useful to buyers and what has been checked." /></label>
          <label className="admin-check wide"><input type="checkbox" checked={form.indexable} onChange={(event) => set("indexable", event.target.checked)} /> Include in search sitemap only after manual review</label>
          <button className="wide" type="submit" disabled={saving}>{saving ? "Saving..." : form.id ? "Save editorial changes" : "Save article"}</button>
          <p className="form-note wide" role="status">{note}</p>
        </form>
      </section>

      <section className="admin-panel"><div className="admin-panel-headline"><div><p className="eyebrow">Editorial library</p><h2>News records</h2></div><a href="/news" target="_blank" rel="noreferrer">View public News</a></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Status</th><th>Index</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{articles.map((article) => <tr key={article.id}><td>{article.title}</td><td>{article.status}</td><td>{article.indexable ? "Indexable" : "noindex"}</td><td>{new Date(article.updatedAt).toLocaleString("zh-CN")}</td><td><button type="button" onClick={() => setForm(formFromArticle(article))}>Edit</button><button type="button" onClick={() => removeArticle(article.id)}>Delete</button></td></tr>)}{!articles.length ? <tr><td colSpan={5}>No News articles yet.</td></tr> : null}</tbody></table></div>
      </section>
    </div>
  );
}
