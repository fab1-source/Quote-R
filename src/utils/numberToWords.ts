/**
 * Converts a currency amount in AED into English words with Dirhams and Fils.
 * E.g. 67433.10 -> "Sixty Seven Thousand Four Hundred Thirty Three Dirhams and Ten Fils"
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertThreeDigits(num: number): string {
  let str = "";
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    str += ONES[hundreds] + " Hundred";
    if (remainder > 0) {
      str += " ";
    }
  }

  if (remainder > 0) {
    if (remainder < 20) {
      str += ONES[remainder];
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      str += TENS[ten];
      if (one > 0) {
        str += " " + ONES[one];
      }
    }
  }

  return str;
}

export function convertNumberToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return "Zero Dirhams Only";
  }

  const rounded = Number(Math.abs(amount).toFixed(2));
  const dirhams = Math.floor(rounded);
  const fils = Math.round((rounded - dirhams) * 100);

  let dirhamsWords = "";

  if (dirhams === 0) {
    dirhamsWords = "Zero";
  } else {
    const billions = Math.floor(dirhams / 1_000_000_000);
    const millions = Math.floor((dirhams % 1_000_000_000) / 1_000_000);
    const thousands = Math.floor((dirhams % 1_000_000) / 1_000);
    const rest = dirhams % 1_000;

    const parts: string[] = [];

    if (billions > 0) {
      parts.push(convertThreeDigits(billions) + " Billion");
    }
    if (millions > 0) {
      parts.push(convertThreeDigits(millions) + " Million");
    }
    if (thousands > 0) {
      parts.push(convertThreeDigits(thousands) + " Thousand");
    }
    if (rest > 0) {
      parts.push(convertThreeDigits(rest));
    }

    dirhamsWords = parts.join(" ");
  }

  let result = dirhamsWords + " Dirhams";

  if (fils > 0) {
    const filsWords = convertThreeDigits(fils);
    result += " and " + filsWords + " Fils";
  } else {
    result += " Only";
  }

  return result;
}
