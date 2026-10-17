import React from 'react';

export default function TabularCurrency({
  amount,
  isDelta = false,
  currency = '$',
  className = ''
}) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const isPositiveDelta = isDelta && num > 0.005;
  const isZeroDelta = isDelta && Math.abs(num) <= 0.005;

  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  let prefix = currency;
  if (isPositiveDelta) prefix = `+${currency}`;
  if (num < -0.005) prefix = `-${currency}`;

  let colorClass = 'text-[#0A2540]';
  if (isPositiveDelta) colorClass = 'text-[#991B1B] font-semibold';
  if (isZeroDelta) colorClass = 'text-[#166534]';

  return (
    <span className={`font-sans tabular-nums tracking-tight ${colorClass} ${className}`}>
      {prefix}{formatted}
    </span>
  );
}
