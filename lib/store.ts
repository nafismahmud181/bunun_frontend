// Content that isn't in the database yet. Products, categories, delivery fees and the
// free-delivery threshold come from the API; the sale banner and reviews move there in Phase 5.
import type { Store } from './types';

export const STORE: Store = {
  saleEnds: '2026-10-21T23:59:59+06:00', // homepage countdown end (Bangladesh time)
  reviews: [
    {
      name: 'Nusrat Jahan',
      city: 'Dhanmondi, Dhaka',
      item: 'Nakshi Kantha Runner',
      text: 'The stitching is beautiful and the colours are exactly as shown. Delivered in one day with cash on delivery — very smooth.',
    },
    {
      name: 'Tanvir Ahmed',
      city: 'Chattogram',
      item: 'Jute Placemats',
      text: 'Bought placemats as a housewarming gift. Good quality jute, neatly packed. Will order again for Eid.',
    },
    {
      name: 'Farhana Rahman',
      city: 'Sylhet',
      item: 'Cushion Covers',
      text: 'Paid with bKash and got it in 3 days. The covers fit perfectly and the fabric feels premium for the price.',
    },
  ],
};
