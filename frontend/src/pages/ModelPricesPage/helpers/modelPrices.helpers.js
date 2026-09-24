import { PER_MILLION } from '@/pages/ModelPricesPage/constants/modelPrices.constants';

export const toPerMillion = perToken => {
  if (perToken === null || perToken === undefined) return '';
  return String(perToken * PER_MILLION);
};

export const fromPerMillion = perMillion => {
  if (perMillion === '' || perMillion === null || perMillion === undefined) {
    return undefined;
  }
  const n = Number(perMillion);
  if (Number.isNaN(n)) return undefined;
  return n / PER_MILLION;
};

export const formatPerMillion = perToken => {
  if (perToken === null || perToken === undefined) return '-';
  const value = perToken * PER_MILLION;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};
