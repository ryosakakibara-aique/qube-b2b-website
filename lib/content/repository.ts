import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BusinessFeature,
  ClientLogo,
  HomepageContent,
  ShowcaseTile,
  StoryCard,
} from "@/lib/content/types";

/**
 * Shared row mapping and column selection for the `homepage` singleton.
 *
 * The four repeated groups travel as `jsonb`, so everything here is defensive: a column edited by
 * hand, or a partial payload, must degrade to something renderable rather than throw inside a
 * server component. Reads that come back the wrong length are repaired in `queries.ts`, not here —
 * this module's job is only to turn a row into the typed object.
 */

export const HOMEPAGE_SELECT = [
  "hero_heading",
  "hero_sub_label",
  "hero_link_label",
  "hero_link_href",
  "cta_label",
  "cta_href",
  "video_url",
  "video_title",
  "features_heading",
  "showcase_heading",
  "clients_heading",
  "business_features",
  "showcase_tiles",
  "client_logos",
  "stories",
  "updated_at",
].join(",");

export type HomepageRow = {
  hero_heading: string;
  hero_sub_label: string;
  hero_link_label: string;
  hero_link_href: string;
  cta_label: string;
  cta_href: string;
  video_url: string;
  video_title: string;
  features_heading: string;
  showcase_heading: string;
  clients_heading: string;
  business_features: unknown;
  showcase_tiles: unknown;
  client_logos: unknown;
  stories: unknown;
  updated_at?: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asPositiveInteger(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

function asRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}

function mapFeature(item: Record<string, unknown>): BusinessFeature {
  return {
    title: asText(item.title),
    headline: asText(item.headline),
    text: asText(item.text),
  };
}

function mapTile(item: Record<string, unknown>): ShowcaseTile {
  return {
    label: asText(item.label),
    imageUrl: asText(item.imageUrl),
  };
}

function mapLogo(item: Record<string, unknown>): ClientLogo {
  return {
    name: asText(item.name),
    imageUrl: asText(item.imageUrl),
    width: asPositiveInteger(item.width),
    height: asPositiveInteger(item.height),
  };
}

function mapStory(item: Record<string, unknown>): StoryCard {
  return {
    name: asText(item.name),
    logoUrl: asText(item.logoUrl),
    logoWidth: asPositiveInteger(item.logoWidth),
    logoHeight: asPositiveInteger(item.logoHeight),
    imageUrl: asText(item.imageUrl),
  };
}

export function mapHomepage(row: HomepageRow): HomepageContent {
  return {
    heroHeading: asText(row.hero_heading),
    heroSubLabel: asText(row.hero_sub_label),
    heroLinkLabel: asText(row.hero_link_label),
    heroLinkHref: asText(row.hero_link_href),
    ctaLabel: asText(row.cta_label),
    ctaHref: asText(row.cta_href),
    videoUrl: asText(row.video_url),
    videoTitle: asText(row.video_title),
    featuresHeading: asText(row.features_heading),
    showcaseHeading: asText(row.showcase_heading),
    clientsHeading: asText(row.clients_heading),
    businessFeatures: asRecords(row.business_features).map(mapFeature),
    showcaseTiles: asRecords(row.showcase_tiles).map(mapTile),
    logos: asRecords(row.client_logos).map(mapLogo),
    stories: asRecords(row.stories).map(mapStory),
  };
}

/** Reads the single homepage row. Null when nothing has been saved yet, which is not an error. */
export async function fetchHomepage(
  client: SupabaseClient,
): Promise<HomepageContent | null> {
  const { data, error } = await client
    .from("homepage")
    .select(HOMEPAGE_SELECT)
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapHomepage(data as unknown as HomepageRow) : null;
}
