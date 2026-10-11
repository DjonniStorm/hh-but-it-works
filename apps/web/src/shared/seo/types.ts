// Слоты под meta и OG уже в типе: пока в head уходит только title.
export type PageSeo = {
  title: string;
  description?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
};
