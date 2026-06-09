import type { ComponentType } from 'react';
import {
  AR, AT, AU, BA, BE, BR, CA, CD, CH, CI, CO, CV, CW, CZ,
  DE, DZ, EC, EG, ES, FR, GH, HR, HT, IQ, IR, JO, JP, KR,
  MA, MX, NL, NO, NZ, PA, PT, PY, QA, SA, SE, SN, TN, TR,
  US, UY, UZ, ZA, GB_ENG, GB_SCT,
} from 'country-flag-icons/react/3x2';

export type FlagComponent = ComponentType<{ title?: string; className?: string; style?: React.CSSProperties }>;

export const FLAG_MAP: Record<string, FlagComponent> = {
  AR, AT, AU, BA, BE, BR, CA, CD, CH, CI, CO, CV, CW, CZ,
  DE, DZ, EC, EG, ES, FR, GH, HR, HT, IQ, IR, JO, JP, KR,
  MA, MX, NL, NO, NZ, PA, PT, PY, QA, SA, SE, SN, TN, TR,
  US, UY, UZ, ZA, GB_ENG, GB_SCT,
};

export function getFlagByCode(code: string): FlagComponent | null {
  return FLAG_MAP[code] ?? null;
}
