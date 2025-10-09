export interface Blog {
  id: string;
  title: string;
  slug: string;
  image: {
    url: string;
  };
  content: string;
  author: {
    name: string;
  };
  publishedDate: string;
}
