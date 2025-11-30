/**
 * Creates a URL by combining pathname and search params
 */
export const createUrl = (
  pathname: string,
  params: URLSearchParams,
): string => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

/**
 * Ensures a string starts with a specified prefix
 */
export const ensureStartsWith = (
  stringToCheck: string,
  startsWith: string,
): string =>
  stringToCheck.startsWith(startsWith)
    ? stringToCheck
    : `${startsWith}${stringToCheck}`;

/**
 * Validates required environment variables for Shopify integration
 */
export const validateEnvironmentVariables = (): void => {
  const requiredEnvironmentVariables = [
    "PUBLIC_SHOPIFY_STORE_DOMAIN",
    "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  ];
  const missingEnvironmentVariables: string[] = [];

  requiredEnvironmentVariables.forEach((envVar) => {
    if (!import.meta.env[envVar]) {
      missingEnvironmentVariables.push(envVar);
    }
  });

  if (missingEnvironmentVariables.length) {
    throw new Error(
      `The following environment variables are missing. Your site will not work without them. Read more: https://docs.astro.build/en/guides/environment-variables/\n\n${missingEnvironmentVariables.join(
        "\n",
      )}\n`,
    );
  }

  if (
    import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN?.includes("[") ||
    import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN?.includes("]")
  ) {
    throw new Error(
      "Your `PUBLIC_SHOPIFY_STORE_DOMAIN` environment variable includes brackets (ie. `[` and / or `]`). Your site will not work with them there. Please remove them.",
    );
  }
};

const PAYLOAD_SERVER_URL = import.meta.env.PUBLIC_PAYLOAD_SERVER_URL;
export function generatPayloadImageUrl(url: string | null | undefined) {
  if (url == undefined) {
    return "/images/product_image404.jpg";
  }
  if (!PAYLOAD_SERVER_URL) {
    return "/images/product_image404.jpg";
  }
  const imageUrl = (url: string, opts: any) =>
    `https://wsrv.nl/?${new URLSearchParams({
      /* The image URL to optimize */
      url,

      /* In case something goes wrong, just show the image */
      default: url,

      /* 
        Compress it as much as possible (PNG).
        See: https://images.weserv.nl/docs/format.html#compression-level 
      */
      l: 9,

      /* 
        Reduce PNG file size.
        See: https://images.weserv.nl/docs/format.html#adaptive-filter
      */
      af: "",

      /*
        Enable image optimization for GIF and JPEG.
        See: https://images.weserv.nl/docs/format.html#interlace-progressive
      */
      il: "",

      /*
        Enable image optimization for WebP and GIF.
        See: https://images.weserv.nl/docs/format.html#number-of-pages
      */
      n: -1,

      /* 
        Pass any other option.
        See https://images.weserv.nl/docs/quick-reference.html 
        
        It's recommended to pass `w` for cutting down the image size.
      */
      ...opts,
    }).toString()}`;
  return imageUrl(new URL(url, PAYLOAD_SERVER_URL).toString(), {});
}
