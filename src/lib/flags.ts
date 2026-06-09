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

const NAME_TO_CODE: Record<string, string> = {
  Algeria: 'DZ', Argentina: 'AR', Australia: 'AU', Austria: 'AT',
  Belgium: 'BE', 'Bosnia & Herzegovina': 'BA', Brazil: 'BR', Canada: 'CA',
  'Cape Verde': 'CV', Colombia: 'CO', Croatia: 'HR', 'Curaçao': 'CW',
  'Czech Republic': 'CZ', 'DR Congo': 'CD', Ecuador: 'EC', Egypt: 'EG',
  England: 'GB_ENG', France: 'FR', Germany: 'DE', Ghana: 'GH',
  Haiti: 'HT', Iran: 'IR', Iraq: 'IQ', 'Ivory Coast': 'CI',
  Japan: 'JP', Jordan: 'JO', Mexico: 'MX', Morocco: 'MA',
  Netherlands: 'NL', 'New Zealand': 'NZ', Norway: 'NO', Panama: 'PA',
  Paraguay: 'PY', Portugal: 'PT', Qatar: 'QA', 'Saudi Arabia': 'SA',
  Scotland: 'GB_SCT', Senegal: 'SN', 'South Africa': 'ZA', 'South Korea': 'KR',
  Spain: 'ES', Sweden: 'SE', Switzerland: 'CH', Tunisia: 'TN',
  Turkey: 'TR', 'United States': 'US', Uruguay: 'UY', Uzbekistan: 'UZ',
};

export function getFlagByName(name: string): FlagComponent | null {
  const code = NAME_TO_CODE[name];
  return code ? getFlagByCode(code) : null;
}
