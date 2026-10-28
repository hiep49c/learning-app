import type { TaiChiForm } from './types';
import { forms0108 } from './forms-01-08';
import { forms0916 } from './forms-09-16';
import { forms1724 } from './forms-17-24';

export * from './types';
export { CANONICAL_SOURCE, FULL_FORM_QUERY, youtubeSearchUrl } from './media';

/** All 24 forms in sequence order. */
export const FORMS: TaiChiForm[] = [...forms0108, ...forms0916, ...forms1724].sort(
  (a, b) => a.order - b.order,
);

export function getFormById(id: string): TaiChiForm | undefined {
  return FORMS.find((f) => f.id === id);
}

export function getFormByOrder(order: number): TaiChiForm | undefined {
  return FORMS.find((f) => f.order === order);
}
