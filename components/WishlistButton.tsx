'use client';

import { useWishlist } from '@/lib/wishlist';
import { useCart } from './CartProvider';

/** Heart that saves a product to this browser's wishlist. `variant="card"` sits on a product photo. */
export default function WishlistButton({
  slug,
  name,
  variant = 'card',
}: {
  slug: string;
  name: string;
  variant?: 'card' | 'pdp';
}) {
  const { has, toggle } = useWishlist();
  const { showToast } = useCart();
  const saved = has(slug);
  return (
    <button
      type="button"
      className={`wish-btn on-${variant} ${saved ? 'saved' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        showToast(toggle(slug) ? 'Saved to your wishlist' : 'Removed from your wishlist');
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" aria-hidden="true">
        <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
      </svg>
      {variant === 'pdp' && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
