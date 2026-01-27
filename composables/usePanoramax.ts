export interface PanoramaxItem {
  id: string;
  collection: string;
  assets: {
    thumb: { href: string };
    sd: { href: string };
    hd: { href: string };
  };
  properties: {
    datetime: string;
  };
}

export const usePanoramax = () => {
  const fetchPanoramaxPicture = async (id: string): Promise<PanoramaxItem | null> => {
    try {
      const response = await fetch(`https://api.panoramax.xyz/api/search?ids=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Panoramax item');
      }
      const data = await response.json();
      return data.features?.[0] || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  return {
    fetchPanoramaxPicture,
  };
};
