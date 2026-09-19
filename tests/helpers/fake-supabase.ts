import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Minimal stand-in for the Supabase query builder.
 *
 * The repository takes its client as a parameter, so a fake records the query the data layer
 * actually builds (filters, range, count requests) and returns canned rows — which is the only way
 * to exercise the read path without a live database.
 */

export type RecordedQuery = {
  table: string;
  columns: string | null;
  countRequested: string | null;
  head: boolean;
  order: { column: string; ascending: boolean } | null;
  filters: Array<[string, unknown]>;
  range: [number, number] | null;
  limit: number | null;
  maybeSingle: boolean;
};

export type FakeSupabaseOptions = {
  /** Rows returned for a list read. */
  rows?: unknown;
  /** Row returned for a single read; `null` models "no matching row". */
  single?: unknown;
  count?: number | null;
  error?: { message: string; code?: string } | null;
};

export type FakeSupabase = {
  client: SupabaseClient;
  queries: RecordedQuery[];
};

export function createFakeSupabase(options: FakeSupabaseOptions = {}): FakeSupabase {
  const queries: RecordedQuery[] = [];

  const client = {
    from(table: string) {
      const query: RecordedQuery = {
        table,
        columns: null,
        countRequested: null,
        head: false,
        order: null,
        filters: [],
        range: null,
        limit: null,
        maybeSingle: false,
      };
      queries.push(query);

      const builder = {
        select(columns: string, selectOptions?: { count?: string; head?: boolean }) {
          query.columns = columns;
          if (selectOptions?.count) query.countRequested = selectOptions.count;
          if (selectOptions?.head) query.head = true;
          return builder;
        },
        order(column: string, orderOptions?: { ascending?: boolean }) {
          query.order = { column, ascending: orderOptions?.ascending ?? true };
          return builder;
        },
        eq(column: string, value: unknown) {
          query.filters.push([column, value]);
          return builder;
        },
        range(from: number, to: number) {
          query.range = [from, to];
          return builder;
        },
        limit(value: number) {
          query.limit = value;
          return builder;
        },
        maybeSingle() {
          query.maybeSingle = true;
          return builder;
        },
        then<TResult1 = unknown, TResult2 = never>(
          onFulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
          onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
          const data = "single" in options ? options.single : (options.rows ?? []);
          return Promise.resolve({
            data,
            error: options.error ?? null,
            count: options.count ?? null,
          }).then(onFulfilled, onRejected);
        },
      };

      return builder;
    },
  };

  return { client: client as unknown as SupabaseClient, queries };
}

/** A complete product row as PostgREST returns it, with nested sections and images out of order. */
export const productRow = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "PANDORA 3.0",
  slug: "pandora",
  description: "Convenient smart lockers.",
  tags: ["smart locker", "enterprise"],
  image_url: "https://example.test/hero.png",
  image_alt: "A QUBE locker",
  acquisition: "Talk to an expert",
  locations: "Multiple",
  cta_label: "Talk to an Expert",
  published: true,
  created_at: "2025-12-31T09:00:00.000Z",
  updated_at: "2026-01-02T03:04:05.000Z",
  product_content_sections: [
    {
      id: "section-b",
      sort_order: 2,
      heading: "DROP",
      body: "Second block",
      product_content_section_images: [
        { sort_order: 1, url: "https://example.test/drop.png", alt: "Drop" },
      ],
    },
    {
      id: "section-a",
      sort_order: 1,
      heading: "WASH",
      body: "First block",
      product_content_section_images: [
        { sort_order: 2, url: "https://example.test/wash-2.png", alt: "Wash two" },
        { sort_order: 1, url: "https://example.test/wash-1.png", alt: "Wash one" },
      ],
    },
  ],
};
