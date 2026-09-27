/** Five stars, filled to the rating (rounded to the nearest half for averages). */
export default function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const r = Math.round(rating * 2) / 2;
  return (
    <span className="stars-row" style={{ fontSize: size }} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= r ? 'on' : i - 0.5 === r ? 'half' : 'off'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
