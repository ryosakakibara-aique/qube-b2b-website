import { test } from "node:test";
import assert from "node:assert/strict";
import { HOMEPAGE_DEFAULTS } from "../lib/content/defaults.ts";
import { parseYouTubeId } from "../lib/content/video.ts";
import { mapHomepage } from "../lib/content/repository.ts";
import { completeContent } from "../lib/content/queries.ts";
import {
  BUSINESS_FEATURE_COUNT,
  SHOWCASE_TILE_COUNT,
  isSafeHref,
  isStoredImageUrl,
  parseHomepageForm,
} from "../lib/content/validation.ts";

/**
 * The homepage form's contract: what it accepts, what it refuses, and what a stored record maps back
 * to.
 *
 * These are pure functions, so the whole path — form → payload → row → renderable object — is settled
 * here rather than in a browser. Two behaviours are worth naming because they are easy to lose:
 *
 * - **The video is a link.** Authors paste whatever the address bar gave them, and validation is what
 *   turns that into an embeddable id or refuses it. A bare id and every common URL form are accepted;
 *   a channel or playlist link is not, because there is no single video to embed.
 * - **A stored record is repaired, not trusted.** The form cannot produce eleven business cells, but
 *   a hand-edited row can, and half a grid is worse than the copy that shipped.
 */

const text = (value: string) => value;

function validForm(): FormData {
  const form = new FormData();
  form.set("heroHeading", HOMEPAGE_DEFAULTS.heroHeading);
  form.set("heroSubLabel", HOMEPAGE_DEFAULTS.heroSubLabel);
  form.set("heroLinkLabel", HOMEPAGE_DEFAULTS.heroLinkLabel);
  form.set("heroLinkHref", HOMEPAGE_DEFAULTS.heroLinkHref);
  form.set("ctaLabel", HOMEPAGE_DEFAULTS.ctaLabel);
  form.set("ctaHref", HOMEPAGE_DEFAULTS.ctaHref);
  form.set("videoUrl", HOMEPAGE_DEFAULTS.videoUrl);
  form.set("videoTitle", HOMEPAGE_DEFAULTS.videoTitle);
  form.set("featuresHeading", HOMEPAGE_DEFAULTS.featuresHeading);
  form.set("showcaseHeading", HOMEPAGE_DEFAULTS.showcaseHeading);
  form.set("clientsHeading", HOMEPAGE_DEFAULTS.clientsHeading);

  HOMEPAGE_DEFAULTS.businessFeatures.forEach((feature, index) => {
    const position = index + 1;
    form.set(`feature${position}Title`, feature.title);
    form.set(`feature${position}Headline`, feature.headline);
    form.set(`feature${position}Text`, feature.text);
  });

  HOMEPAGE_DEFAULTS.showcaseTiles.forEach((tile, index) => {
    const position = index + 1;
    form.set(`tile${position}Label`, tile.label);
    form.set(`tile${position}ImageUrl`, tile.imageUrl);
  });

  form.set("logoCount", String(HOMEPAGE_DEFAULTS.logos.length));
  HOMEPAGE_DEFAULTS.logos.forEach((logo, index) => {
    const position = index + 1;
    form.set(`logo${position}Name`, logo.name);
    form.set(`logo${position}ImageUrl`, logo.imageUrl);
    form.set(`logo${position}Width`, String(logo.width));
    form.set(`logo${position}Height`, String(logo.height));
  });

  form.set("storyCount", String(HOMEPAGE_DEFAULTS.stories.length));
  HOMEPAGE_DEFAULTS.stories.forEach((story, index) => {
    const position = index + 1;
    form.set(`story${position}Name`, story.name);
    form.set(`story${position}LogoUrl`, story.logoUrl);
    form.set(`story${position}LogoWidth`, String(story.logoWidth));
    form.set(`story${position}LogoHeight`, String(story.logoHeight));
    form.set(`story${position}ImageUrl`, story.imageUrl);
  });

  return form;
}

test("the shipped copy is a valid payload", () => {
  const result = parseHomepageForm(validForm());

  assert.equal(result.ok, true, "the defaults must satisfy the same rules an author is held to");
  if (!result.ok) return;

  assert.equal(result.payload.businessFeatures.length, BUSINESS_FEATURE_COUNT);
  assert.equal(result.payload.showcaseTiles.length, SHOWCASE_TILE_COUNT);
  assert.equal(result.payload.logos.length, 8);
  assert.equal(result.payload.stories.length, 8);
  assert.equal(result.payload.videoUrl, HOMEPAGE_DEFAULTS.videoUrl);
});

test("every string is trimmed", () => {
  const form = validForm();
  form.set("heroHeading", "  A headline with padding  ");
  form.set("feature1Title", "  Hospitals  ");
  form.set("logo1Name", "  Jollibee  ");

  const result = parseHomepageForm(form);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.payload.heroHeading, "A headline with padding");
  assert.equal(result.payload.businessFeatures[0].title, "Hospitals");
  assert.equal(result.payload.logos[0].name, "Jollibee");
});

test("a link that cannot be rendered is refused", () => {
  const javascript = validForm();
  javascript.set("ctaHref", "javascript:alert(1)");
  const first = parseHomepageForm(javascript);
  assert.equal(first.ok, false);
  if (!first.ok) {
    assert.ok(first.fieldErrors.ctaHref, "an executable link is refused with a field error");
  }

  const protocolRelative = validForm();
  protocolRelative.set("heroLinkHref", "//evil.example.com");
  const second = parseHomepageForm(protocolRelative);
  assert.equal(second.ok, false, "//host is an off-site link, not an internal path");

  const noHash = validForm();
  noHash.set("ctaHref", "#");
  assert.equal(
    parseHomepageForm(noHash).ok,
    false,
    "a bare '#' is a dead link, which is exactly what the CTA used to be",
  );
});

test("hrefs and image urls accept only what can be served or followed", () => {
  for (const href of ["/products", "#contact", "https://example.com/page"]) {
    assert.equal(isSafeHref(href), true, `${href} should be allowed`);
  }
  for (const href of ["", "#", "//evil.example.com", "javascript:alert(1)", "example.com"]) {
    assert.equal(isSafeHref(href), false, `${href} should be refused`);
  }

  for (const url of ["/qube-logo.svg", "/pandora-features-images/pandora-1.png", "https://xyz.supabase.co/storage/v1/object/public/site-images/a/b.png"]) {
    assert.equal(isStoredImageUrl(url), true, `${url} is servable`);
  }
  for (const url of ["", "//cdn.example.com/a.png", "javascript:alert(1)"]) {
    assert.equal(isStoredImageUrl(url), false, `${url} is not`);
  }
});

test("a logo needs a name, an image and its pixel size", () => {
  const missingName = validForm();
  missingName.set("logo2Name", "");
  const first = parseHomepageForm(missingName);
  assert.equal(first.ok, false);
  if (!first.ok) {
    assert.ok(first.fieldErrors.logo2Name, "the name is the image's alt text, so it is required");
  }

  const missingSize = validForm();
  missingSize.set("logo3Height", "0");
  const second = parseHomepageForm(missingSize);
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.ok(
      second.fieldErrors.logo3ImageUrl,
      "without an intrinsic size next/image cannot reserve space, so the upload is reported instead",
    );
  }
});

test("a story may have no photograph, but must have a logo and a name", () => {
  const noPhoto = validForm();
  noPhoto.set("story1ImageUrl", "");
  assert.equal(
    parseHomepageForm(noPhoto).ok,
    true,
    "a story without a photograph is the card the design shipped, so it stays valid",
  );

  const noLogo = validForm();
  noLogo.set("story1LogoUrl", "");
  const result = parseHomepageForm(noLogo);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.fieldErrors.story1LogoUrl);
});

test("the logo and story lists are bounded", () => {
  const tooManyLogos = validForm();
  tooManyLogos.set("logoCount", "99");
  const many = parseHomepageForm(tooManyLogos);
  assert.equal(many.ok, false, "a count past the cap must not silently drop rows");

  const noLogos = validForm();
  noLogos.set("logoCount", "0");
  const none = parseHomepageForm(noLogos);
  assert.equal(none.ok, false);
  if (!none.ok) {
    assert.ok(none.fieldErrors.logoCount, "the strip is not allowed to be empty");
  }
});

test("the video link is normalised, or refused", () => {
  const cases: Array<[string, string | null]> = [
    ["https://www.youtube.com/watch?v=EELwau9_mTA", "EELwau9_mTA"],
    ["https://youtube.com/watch?v=EELwau9_mTA&t=30s", "EELwau9_mTA"],
    ["https://youtu.be/EELwau9_mTA", "EELwau9_mTA"],
    ["https://www.youtube.com/embed/EELwau9_mTA?autoplay=1", "EELwau9_mTA"],
    ["https://www.youtube.com/shorts/EELwau9_mTA", "EELwau9_mTA"],
    ["https://m.youtube.com/watch?v=EELwau9_mTA", "EELwau9_mTA"],
    ["  EELwau9_mTA  ", "EELwau9_mTA"],
    ["https://www.youtube.com/playlist?list=PL123", null],
    ["https://www.youtube.com/@qube", null],
    ["https://vimeo.com/123456789", null],
    ["not a url", null],
    ["", null],
  ];

  for (const [input, expected] of cases) {
    assert.equal(parseYouTubeId(input), expected, `${input} should parse to ${expected}`);
  }
});

test("a video without a description is refused, because nothing would name the frame", () => {
  const form = validForm();
  form.set("videoTitle", "");
  const result = parseHomepageForm(form);
  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.fieldErrors.videoTitle);

  const noVideo = validForm();
  noVideo.set("videoUrl", "");
  noVideo.set("videoTitle", "");
  const allowed = parseHomepageForm(noVideo);
  assert.equal(allowed.ok, true, "an empty link is the poster state, which is a legitimate hero");
  if (allowed.ok) {
    assert.equal(allowed.payload.videoTitle, "", "a description without a video describes nothing");
  }
});

test("a junk video link is refused with advice", () => {
  const form = validForm();
  form.set("videoUrl", "https://vimeo.com/123456789");
  const result = parseHomepageForm(form);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.fieldErrors.videoUrl, /YouTube/);
  }
});

test("a stored row maps to the typed record", () => {
  const mapped = mapHomepage({
    hero_heading: "Heading",
    hero_sub_label: "Label",
    hero_link_label: "Link",
    hero_link_href: "/products",
    cta_label: "CTA",
    cta_href: "#contact",
    video_url: "https://youtu.be/EELwau9_mTA",
    video_title: "Demo",
    features_heading: "Features",
    showcase_heading: "Showcase",
    clients_heading: "Clients",
    business_features: [{ title: "A", headline: "B", text: "C" }],
    showcase_tiles: [{ label: "Tile", imageUrl: "/x.png" }],
    client_logos: [{ name: "Logo", imageUrl: "/l.png", width: 10, height: 4 }],
    stories: [{ name: "Story", logoUrl: "/s.svg", logoWidth: 8, logoHeight: 8, imageUrl: "" }],
  });

  assert.equal(mapped.heroHeading, "Heading");
  assert.deepEqual(mapped.businessFeatures, [{ title: "A", headline: "B", text: "C" }]);
  assert.deepEqual(mapped.showcaseTiles, [{ label: "Tile", imageUrl: "/x.png" }]);
  assert.deepEqual(mapped.logos, [
    { name: "Logo", imageUrl: "/l.png", width: 10, height: 4 },
  ]);
  assert.equal(mapped.stories[0].imageUrl, "");
});

test("a malformed or missing group degrades instead of throwing", () => {
  const mapped = mapHomepage({
    hero_heading: "Heading",
    hero_sub_label: "",
    hero_link_label: "",
    hero_link_href: "",
    cta_label: "",
    cta_href: "",
    video_url: "",
    video_title: "",
    features_heading: "",
    showcase_heading: "",
    clients_heading: "",
    business_features: null,
    showcase_tiles: "not an array",
    client_logos: [{ name: 42, imageUrl: null, width: "170", height: -1 }],
    stories: [],
  });

  assert.deepEqual(mapped.businessFeatures, []);
  assert.deepEqual(mapped.showcaseTiles, []);
  assert.equal(mapped.logos[0].name, "", "a non-string name becomes empty, not the number 42");
  assert.equal(mapped.logos[0].width, 170, "a numeric string is read");
  assert.equal(mapped.logos[0].height, 0, "a negative dimension is not a dimension");
});

test("a record with the wrong number of fixed rows renders the built-in copy for that group", () => {
  const truncated = {
    ...HOMEPAGE_DEFAULTS,
    businessFeatures: HOMEPAGE_DEFAULTS.businessFeatures.slice(0, 11),
    showcaseTiles: HOMEPAGE_DEFAULTS.showcaseTiles.slice(0, 8),
  };

  const repaired = completeContent(truncated);

  assert.equal(repaired.businessFeatures.length, BUSINESS_FEATURE_COUNT);
  assert.equal(repaired.showcaseTiles.length, SHOWCASE_TILE_COUNT);
  assert.equal(
    repaired.heroHeading,
    HOMEPAGE_DEFAULTS.heroHeading,
    "the rest of the record is untouched",
  );
});

test("a record that is already complete is returned unchanged", () => {
  const repaired = completeContent(HOMEPAGE_DEFAULTS);
  assert.deepEqual(repaired, HOMEPAGE_DEFAULTS);
});

test("the defaults are internally consistent", () => {
  const { businessFeatures, showcaseTiles, logos, stories } = HOMEPAGE_DEFAULTS;

  assert.equal(businessFeatures.length, BUSINESS_FEATURE_COUNT);
  assert.equal(showcaseTiles.length, SHOWCASE_TILE_COUNT);
  assert.ok(logos.length > 0 && stories.length > 0);

  for (const value of [
    HOMEPAGE_DEFAULTS.heroHeading,
    HOMEPAGE_DEFAULTS.heroSubLabel,
    HOMEPAGE_DEFAULTS.heroLinkLabel,
    HOMEPAGE_DEFAULTS.ctaLabel,
    HOMEPAGE_DEFAULTS.featuresHeading,
    HOMEPAGE_DEFAULTS.showcaseHeading,
    HOMEPAGE_DEFAULTS.clientsHeading,
  ]) {
    assert.equal(value, text(value.trim()), "no heading ships with padding");
  }

  for (const tile of showcaseTiles) {
    assert.ok(tile.imageUrl.startsWith("/"), "the shipped tiles are repository files");
  }

  for (const story of stories) {
    assert.equal(
      story.imageUrl,
      "",
      "no story photograph ships with the site: the design has none, and inventing one is not content work",
    );
  }
});
