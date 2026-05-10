import type { MetadataRoute } from "next";
import { clientEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/signup`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/impressum`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/datenschutz`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/agb`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
