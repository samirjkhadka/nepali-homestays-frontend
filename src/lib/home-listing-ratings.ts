/**
 * Home (hero + featured) marketing display for ratings/reviews.
 * - 0 reviews: stable pseudo-rating in (4, 5) with one decimal (not from DB).
 * - 1–99 reviews: show real average; count label is always "100+".
 * - 100+ reviews: show real average and the actual count.
 */
function pseudoRatingOverFour(listingId: number): string {
  let h = listingId;
  h = (h ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = h % 9;
  const n = 4.1 + h * 0.1;
  return n.toFixed(1);
}

export function getHomeDisplayRating(
  listingId: number,
  averageRating: number | null | undefined,
  reviewCount: number | null | undefined
): string {
  const n = reviewCount == null || !Number.isFinite(Number(reviewCount)) ? 0 : Number(reviewCount);
  if (n === 0) {
    return pseudoRatingOverFour(listingId);
  }
  const avg = Number(averageRating);
  if (!Number.isFinite(avg) || avg <= 0) return pseudoRatingOverFour(listingId);
  return avg.toFixed(1);
}

export function getHomeDisplayReviewCountLabel(reviewCount: number | null | undefined): string {
  const n = reviewCount == null || !Number.isFinite(Number(reviewCount)) ? 0 : Number(reviewCount);
  if (n < 100) return '100+';
  return String(n);
}
