import { shortName } from '@/lib/utils';

/**
 * A product name cut to 30 characters with "…". The full name shows on hover, and screen readers
 * read the full name instead of the shortened one.
 */
export default function ShortName({ name, max }: { name: string; max?: number }) {
  const short = shortName(name, max);
  if (short === name) return <>{name}</>;
  return (
    <span title={name}>
      <span aria-hidden="true">{short}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}
