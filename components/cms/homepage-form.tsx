"use client";

import { useActionState, useRef, useState } from "react";
import { SiteImageField } from "@/components/cms/site-image-field";
import { saveHomepage } from "@/lib/content/actions";
import { SHOWCASE_SLOTS } from "@/lib/content/showcase";
import {
  BUSINESS_FEATURE_COUNT,
  MAX_FEATURE_HEADLINE_LENGTH,
  MAX_FEATURE_TEXT_LENGTH,
  MAX_FEATURE_TITLE_LENGTH,
  MAX_HEADING_LENGTH,
  MAX_HREF_LENGTH,
  MAX_LINK_LABEL_LENGTH,
  MAX_LOGO_COUNT,
  MAX_NAME_LENGTH,
  MAX_SECTION_HEADING_LENGTH,
  MAX_STORY_COUNT,
  MAX_TILE_LABEL_LENGTH,
  MAX_VIDEO_TITLE_LENGTH,
  MAX_VIDEO_URL_LENGTH,
  MIN_LOGO_COUNT,
  MIN_STORY_COUNT,
} from "@/lib/content/validation";
import { LOGO_IMAGE_NOTE, STORY_IMAGE_NOTE } from "@/lib/media/storage";
import type {
  BusinessFeature,
  ClientLogo,
  HomepageContent,
  ShowcaseTile,
  StoryCard,
} from "@/lib/content/types";

/**
 * The homepage editor.
 *
 * Laid out in the client's own numbering — hero, CTA, video, logos, the business grid, PANDORA, Our
 * Clients, success stories — so the screen reads like the list that was signed off.
 *
 * The two fixed groups have no add or remove: twelve business cells and nine showcase tiles are the
 * design's numbers, and a "remove" button on a fixed group is an invitation to break the grid. The
 * logo and story lists are variable, so those rows can be added and removed within their caps.
 *
 * Logos are edited once, in section 4. Section 7 shows where they appear rather than offering a
 * second editor for the same array — two editors for one list is how the hero strip and the marquee
 * drift apart.
 */

type DraftLogo = ClientLogo & { key: string };
type DraftStory = StoryCard & { key: string };

function toDraftLogos(logos: ClientLogo[]): DraftLogo[] {
  return logos.map((logo, index) => ({ ...logo, key: `saved-logo-${index}` }));
}

function toDraftStories(stories: StoryCard[]): DraftStory[] {
  return stories.map((story, index) => ({ ...story, key: `saved-story-${index}` }));
}

const inputClass = "cms-input mt-1 h-8 text-[10px]";
const labelClass = "block text-[10px]";
const errorClass = "mt-1 text-[9px] text-red-700";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  error,
  maxLength,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder: string;
  error?: string;
  maxLength?: number;
  hint?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <div className="min-w-0">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={inputClass}
      />
      {hint && !error ? (
        <p className="mt-1 text-[9px] text-[var(--text-muted)]">{hint}</p>
      ) : null}
      {error ? (
        <p id={errorId} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  error,
  maxLength,
  rows = 2,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  maxLength?: number;
  rows?: number;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className="cms-input mt-1 resize-y text-[10px]"
      />
      {error ? (
        <p id={`${name}-error`} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)] p-4">
      <legend className="px-1 text-xs font-bold">
        {number}. {title}
      </legend>
      {description ? (
        <p className="mb-3 text-[10px] text-[var(--text-muted)]">{description}</p>
      ) : null}
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

function FeatureEditor({
  position,
  feature,
  errors,
}: {
  position: number;
  feature: BusinessFeature;
  errors: Record<string, string>;
}) {
  return (
    <fieldset className="border-t border-[var(--border-subtle)] pt-3 first:border-t-0 first:pt-0">
      <legend className="text-[10px] font-bold">Business {position}</legend>
      <div className="mt-2 space-y-2">
        <Field
          label={`Title ${position}`}
          name={`feature${position}Title`}
          defaultValue={feature.title}
          placeholder="e.g. Hospitals & Healthcare"
          error={errors[`feature${position}Title`]}
          maxLength={MAX_FEATURE_TITLE_LENGTH}
        />
        <Field
          label={`Headline ${position}`}
          name={`feature${position}Headline`}
          defaultValue={feature.headline}
          placeholder="The line that sells it"
          error={errors[`feature${position}Headline`]}
          maxLength={MAX_FEATURE_HEADLINE_LENGTH}
        />
        <TextField
          label={`Detail ${position}`}
          name={`feature${position}Text`}
          defaultValue={feature.text}
          maxLength={MAX_FEATURE_TEXT_LENGTH}
          error={errors[`feature${position}Text`]}
        />
      </div>
    </fieldset>
  );
}

function TileEditor({
  position,
  tile,
  errors,
}: {
  position: number;
  tile: ShowcaseTile;
  errors: Record<string, string>;
}) {
  const slot = SHOWCASE_SLOTS[position - 1];
  return (
    <fieldset className="border-t border-[var(--border-subtle)] pt-3 first:border-t-0 first:pt-0">
      <legend className="text-[10px] font-bold">
        Tile {position} of {SHOWCASE_SLOTS.length}
        {slot ? ` — ${slot.shape}` : ""}
      </legend>
      <div className="mt-2 space-y-2">
        <Field
          label={`Label ${position}`}
          name={`tile${position}Label`}
          defaultValue={tile.label}
          placeholder="e.g. QUBE App"
          error={errors[`tile${position}Label`]}
          maxLength={MAX_TILE_LABEL_LENGTH}
        />
        <SiteImageField
          label={`Photograph ${position}`}
          hint={slot?.uploadNote ?? "Match the tile's shape"}
          urlName={`tile${position}ImageUrl`}
          initialUrl={tile.imageUrl}
          error={errors[`tile${position}ImageUrl`]}
        />
      </div>
    </fieldset>
  );
}

export function HomepageForm({
  content,
  formId = "homepage-form",
}: {
  content: HomepageContent;
  formId?: string;
}) {
  const [state, formAction, pending] = useActionState(saveHomepage, {});
  const errors = state.fieldErrors ?? {};
  const [logos, setLogos] = useState<DraftLogo[]>(() => toDraftLogos(content.logos));
  const [stories, setStories] = useState<DraftStory[]>(() =>
    toDraftStories(content.stories),
  );
  const nextLogo = useRef(0);
  const nextStory = useRef(0);

  function addLogo() {
    setLogos((current) => {
      if (current.length >= MAX_LOGO_COUNT) return current;
      nextLogo.current += 1;
      return [
        ...current,
        { key: `new-logo-${nextLogo.current}`, name: "", imageUrl: "", width: 0, height: 0 },
      ];
    });
  }

  function removeLogo(key: string) {
    setLogos((current) => current.filter((logo) => logo.key !== key));
  }

  function addStory() {
    setStories((current) => {
      if (current.length >= MAX_STORY_COUNT) return current;
      nextStory.current += 1;
      return [
        ...current,
        {
          key: `new-story-${nextStory.current}`,
          name: "",
          logoUrl: "",
          logoWidth: 0,
          logoHeight: 0,
          imageUrl: "",
        },
      ];
    });
  }

  function removeStory(key: string) {
    setStories((current) => current.filter((story) => story.key !== key));
  }

  return (
    <form id={formId} action={formAction} className="space-y-5">
      <input type="hidden" name="logoCount" value={logos.length} />
      <input type="hidden" name="storyCount" value={stories.length} />

      <Section number={1} title="Hero text">
        <Field
          label="Headline"
          name="heroHeading"
          defaultValue={content.heroHeading}
          placeholder="The H1 on the landing page"
          error={errors.heroHeading}
          maxLength={MAX_HEADING_LENGTH}
        />
        <Field
          label="Sub-heading label"
          name="heroSubLabel"
          defaultValue={content.heroSubLabel}
          placeholder="e.g. QUBE Product Suite"
          error={errors.heroSubLabel}
          maxLength={MAX_LINK_LABEL_LENGTH}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Link text"
            name="heroLinkLabel"
            defaultValue={content.heroLinkLabel}
            placeholder="e.g. Explore Our Products"
            error={errors.heroLinkLabel}
            maxLength={MAX_LINK_LABEL_LENGTH}
          />
          <Field
            label="Link path"
            name="heroLinkHref"
            defaultValue={content.heroLinkHref}
            placeholder="e.g. /products"
            error={errors.heroLinkHref}
            maxLength={MAX_HREF_LENGTH}
          />
        </div>
      </Section>

      <Section number={2} title="Primary button">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Button label"
            name="ctaLabel"
            defaultValue={content.ctaLabel}
            placeholder="e.g. Talk to an Expert"
            error={errors.ctaLabel}
            maxLength={MAX_LINK_LABEL_LENGTH}
          />
          <Field
            label="Button path"
            name="ctaHref"
            defaultValue={content.ctaHref}
            placeholder="e.g. #contact"
            error={errors.ctaHref}
            maxLength={MAX_HREF_LENGTH}
          />
        </div>
      </Section>

      <Section
        number={3}
        title="Hero video"
        description="Paste the YouTube link. Leave it empty to show the poster instead."
      >
        <Field
          label="Video link"
          name="videoUrl"
          defaultValue={content.videoUrl}
          placeholder="https://www.youtube.com/watch?v=..."
          error={errors.videoUrl}
          maxLength={MAX_VIDEO_URL_LENGTH}
          hint="Watch, youtu.be, shorts and embed links all work."
        />
        <Field
          label="Video description"
          name="videoTitle"
          defaultValue={content.videoTitle}
          placeholder="What the video shows"
          error={errors.videoTitle}
          maxLength={MAX_VIDEO_TITLE_LENGTH}
          hint="This is the frame's only name: an embedded video has no alt text, so a screen reader announces exactly this."
        />
      </Section>

      <Section
        number={4}
        title="Client logos"
        description="One list, shown twice: under the hero video and on Our Clients."
      >
        {errors.logoCount ? (
          <p role="alert" className="text-[9px] text-red-700">
            {errors.logoCount}
          </p>
        ) : null}

        {logos.map((logo, index) => {
          const position = index + 1;
          return (
            <fieldset
              key={logo.key}
              className="border-t border-[var(--border-subtle)] pt-3 first:border-t-0 first:pt-0"
            >
              <legend className="text-[10px] font-bold">Logo {position}</legend>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Field
                    label={`Client name ${position}`}
                    name={`logo${position}Name`}
                    defaultValue={logo.name}
                    placeholder="e.g. Jollibee"
                    error={errors[`logo${position}Name`]}
                    maxLength={MAX_NAME_LENGTH}
                    hint="Used as the image's alt text."
                  />
                  <SiteImageField
                    label={`Logo image ${position}`}
                    hint={LOGO_IMAGE_NOTE}
                    urlName={`logo${position}ImageUrl`}
                    widthName={`logo${position}Width`}
                    heightName={`logo${position}Height`}
                    initialUrl={logo.imageUrl}
                    initialWidth={logo.width}
                    initialHeight={logo.height}
                    error={errors[`logo${position}ImageUrl`]}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLogo(logo.key)}
                  disabled={logos.length <= MIN_LOGO_COUNT}
                  className="shrink-0 text-[9px] text-[var(--text-muted)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </fieldset>
          );
        })}

        <button
          type="button"
          onClick={addLogo}
          disabled={logos.length >= MAX_LOGO_COUNT}
          className="rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60"
        >
          Add logo
        </button>
      </Section>

      <Section
        number={5}
        title="Business grid"
        description={`${BUSINESS_FEATURE_COUNT} cells, fixed. The grid fills whole rows at every screen size, so the count cannot change yet.`}
      >
        <Field
          label="Heading"
          name="featuresHeading"
          defaultValue={content.featuresHeading}
          placeholder="The heading above the grid"
          error={errors.featuresHeading}
          maxLength={MAX_SECTION_HEADING_LENGTH}
        />
        {content.businessFeatures.map((feature, index) => (
          <FeatureEditor
            key={`feature-${index + 1}`}
            position={index + 1}
            feature={feature}
            errors={errors}
          />
        ))}
      </Section>

      <Section
        number={6}
        title="PANDORA showcase"
        description={`${SHOWCASE_SLOTS.length} tiles, fixed. Each slot has its own shape; upload a photograph that matches it or the panel will crop badly.`}
      >
        <Field
          label="Heading"
          name="showcaseHeading"
          defaultValue={content.showcaseHeading}
          placeholder="The heading above the showcase"
          error={errors.showcaseHeading}
          maxLength={MAX_SECTION_HEADING_LENGTH}
        />
        {content.showcaseTiles.map((tile, index) => (
          <TileEditor
            key={`tile-${index + 1}`}
            position={index + 1}
            tile={tile}
            errors={errors}
          />
        ))}
      </Section>

      <Section number={7} title="Our Clients">
        <Field
          label="Heading"
          name="clientsHeading"
          defaultValue={content.clientsHeading}
          placeholder="The heading above the logo panel"
          error={errors.clientsHeading}
          maxLength={MAX_SECTION_HEADING_LENGTH}
        />
        <p className="text-[9px] text-[var(--text-muted)]">
          The logos in this section are the ones from section 4 — there is only one
          list, so editing it there updates both places. The &ldquo;Learn More&rdquo;
          button is not editable.
        </p>
      </Section>

      <Section
        number={8}
        title="Success stories"
        description="The logo on each card, and the photograph behind it. A card with no photograph stays plain black."
      >
        {errors.storyCount ? (
          <p role="alert" className="text-[9px] text-red-700">
            {errors.storyCount}
          </p>
        ) : null}

        {stories.map((story, index) => {
          const position = index + 1;
          return (
            <fieldset
              key={story.key}
              className="border-t border-[var(--border-subtle)] pt-3 first:border-t-0 first:pt-0"
            >
              <legend className="text-[10px] font-bold">Story {position}</legend>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Field
                    label={`Client name ${position}`}
                    name={`story${position}Name`}
                    defaultValue={story.name}
                    placeholder="e.g. Jollibee"
                    error={errors[`story${position}Name`]}
                    maxLength={MAX_NAME_LENGTH}
                    hint="Used as the logo's alt text."
                  />
                  <SiteImageField
                    label={`Story logo ${position}`}
                    hint={LOGO_IMAGE_NOTE}
                    urlName={`story${position}LogoUrl`}
                    widthName={`story${position}LogoWidth`}
                    heightName={`story${position}LogoHeight`}
                    initialUrl={story.logoUrl}
                    initialWidth={story.logoWidth}
                    initialHeight={story.logoHeight}
                    error={errors[`story${position}LogoUrl`]}
                  />
                  <SiteImageField
                    label={`Story photograph ${position} (optional)`}
                    hint={STORY_IMAGE_NOTE}
                    urlName={`story${position}ImageUrl`}
                    initialUrl={story.imageUrl}
                    error={errors[`story${position}ImageUrl`]}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStory(story.key)}
                  disabled={stories.length <= MIN_STORY_COUNT}
                  className="shrink-0 text-[9px] text-[var(--text-muted)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </fieldset>
          );
        })}

        <button
          type="button"
          onClick={addStory}
          disabled={stories.length >= MAX_STORY_COUNT}
          className="rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60"
        >
          Add story
        </button>
      </Section>

      <div className="flex items-center justify-end gap-2">
        {state.error ? (
          <p role="alert" className="mr-auto text-xs text-red-700">
            {state.error}
          </p>
        ) : null}
        <button
          disabled={pending}
          type="submit"
          className="rounded-[var(--radius-chip)] bg-[var(--cms-surface)] px-3 py-1 text-[10px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
