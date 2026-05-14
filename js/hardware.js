// RandomX is CPU-optimized; no ASICs. Hash rates are approximate stock speeds.
const HARDWARE_PRESETS = [
  { name: 'AMD Ryzen 9 9950X',          hashRate: 24500, powerW: 150, price: 550 },
  { name: 'AMD Ryzen 9 7950X',          hashRate: 21500, powerW: 170, price: 490 },
  { name: 'AMD Ryzen 9 5950X',          hashRate: 20000, powerW: 145, price: 340 },
  { name: 'AMD Ryzen 7 5800X3D',        hashRate: 15500, powerW: 105, price: 240 },
  { name: 'AMD Ryzen 7 7700X',          hashRate: 13500, powerW: 105, price: 290 },
  { name: 'AMD Ryzen 5 7600',           hashRate:  9200, powerW:  65, price: 190 },
  { name: 'AMD Ryzen 5 5600X',          hashRate:  8200, powerW:  65, price: 140 },
  { name: 'Intel Core i9-13900K',       hashRate: 12000, powerW: 253, price: 370 },
  { name: 'AMD Threadripper 3970X',     hashRate: 35000, powerW: 280, price: 590 },
  { name: 'AMD Threadripper PRO 5965WX',hashRate: 43000, powerW: 350, price: 1190 },
];
