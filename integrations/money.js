// Exact signed fixed-point values; round only at presentation, not per imported row.
export function micros(value) {
  const text=String(value);
  if (!/^-?\d+(\.\d{1,6})?$/.test(text)) throw new Error('Invalid monetary precision');
  const negative=text.startsWith('-');const [whole,fraction='']=text.replace('-','').split('.');
  return (negative?-1n:1n)*(BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0')));
}
export function decimal(value) {
  const n=BigInt(value), a=n<0n?-n:n;
  return `${n<0n?'-':''}${a/1000000n}.${String(a%1000000n).padStart(6,'0')}`;
}
export const money = value => value == null ? null : decimal(micros(value));
export const minorMoney = value => {if(!Number.isSafeInteger(value))throw new Error('Invalid minor-unit amount');return decimal(BigInt(value)*10000n);};
