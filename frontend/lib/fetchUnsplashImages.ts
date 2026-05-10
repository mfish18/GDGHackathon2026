const ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_KEY;

export async function fetchUnsplashImages(queries: string[]) {
  const photos = await Promise.all(
    queries.map(async (query) => {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
          query
        )}&client_id=${ACCESS_KEY}`
      );

      const data = await res.json();

      return {
        id: data.id,
        label: query,
        imageUrl: data.urls.regular,
      };
    })
  );

  return photos;
}