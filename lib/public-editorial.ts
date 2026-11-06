import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPublishedBlogArticle, getPublishedBlogPosts } from "@/lib/blog";
import { getNewsArticle, getNewsCategories, getPublishedNews } from "@/lib/news";

export const PUBLIC_EDITORIAL_TAG = "public-editorial";
const policy = { revalidate: 7200, tags: [PUBLIC_EDITORIAL_TAG] };

export const readPublicNewsArticle = cache(unstable_cache(getNewsArticle, ["published-news-article"], policy));
export const readPublicBlogArticle = cache(unstable_cache(getPublishedBlogArticle, ["published-blog-article"], policy));
export const readPublicNewsCategories = unstable_cache(getNewsCategories, ["published-news-topics"], policy);
export const readPublicNewsPage = unstable_cache(getPublishedNews, ["published-news-page"], policy);
export const readPublicBlogPage = unstable_cache(getPublishedBlogPosts, ["published-blog-page"], policy);
