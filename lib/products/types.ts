export type ProductImage = {
  url: string;
  alt: string;
};

export type ProductContentSection = {
  heading: string;
  body: string;
  images: ProductImage[];
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  /** The wide hero image: the product page banner, related tiles, Open Graph and structured data. */
  imageUrl?: string;
  imageAlt?: string;
  /** The square card image for the `/products` carousel. Independent of the hero, by decision. */
  cardImageUrl?: string;
  cardImageAlt?: string;
  acquisition: string;
  locations: string;
  ctaLabel: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  contentSections: ProductContentSection[];
};

export type ProductActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};
