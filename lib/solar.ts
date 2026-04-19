export interface SolarInput {
  hoursPerDay: number;
  replacedWatts: number;
  rateLKR: number;
  productPriceLKR: number;
}

export interface SolarOutput {
  dailyKWh: number;
  annualSavings: number;
  paybackMonths: number;
}

export function computeSolarSavings(input: SolarInput): SolarOutput {
  const dailyKWh = (input.replacedWatts * input.hoursPerDay) / 1000;
  const annualSavings = Math.round(dailyKWh * 365 * input.rateLKR);
  const monthly = annualSavings / 12;
  let paybackMonths: number;
  if (input.productPriceLKR <= 0) paybackMonths = 0;
  else if (monthly <= 0) paybackMonths = Infinity;
  else paybackMonths = Math.ceil(input.productPriceLKR / monthly);
  return { dailyKWh, annualSavings, paybackMonths };
}
