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
  imageUrl?: string;
  imageAlt?: string;
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
