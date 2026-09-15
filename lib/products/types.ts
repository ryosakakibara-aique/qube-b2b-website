export type ProductContentSection = {
  heading: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  imageAlt?: string;
  acquisition: string;
  locations: string;
  ctaLabel: string;
  contentSections: ProductContentSection[];
};

export type ProductActionState = {
  error?: string;
  success?: string;
};
