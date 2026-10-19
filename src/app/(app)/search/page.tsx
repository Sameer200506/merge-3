import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchClient } from "@/components/search/search-client";
import { globalSearch, type SearchResult } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const results: SearchResult[] = query.trim() ? await globalSearch(query) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Find anything across your workspace." />
      <SearchClient initialQuery={query} initialResults={results} />
    </div>
  );
}
