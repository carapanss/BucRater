import { motion } from 'framer-motion';
import { springFirm } from '../lib/motion';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Número que cambia como un contador mecánico: cada dígito es una tira que rueda hasta su
 * posición, en cascada de derecha a izquierda. Para lectores de pantalla es texto normal.
 */
export function DigitRoll({ value }: { value: number }) {
  const text = value.toLocaleString('es-ES');
  const chars = text.split('');

  return (
    <span className="digit-roll">
      <span className="sr-only">{text}</span>
      {chars.map((char, i) => {
        const digit = DIGITS.indexOf(char);
        const fromRight = chars.length - 1 - i;
        if (digit === -1) {
          return (
            <span key={`sep-${i}`} aria-hidden="true">
              {char}
            </span>
          );
        }
        return (
          <span key={fromRight} className="digit-roll-cell" aria-hidden="true">
            <span className="digit-roll-sizer">{char}</span>
            <motion.span
              className="digit-roll-strip"
              initial={{ y: '0em' }}
              animate={{ y: `${-digit}em` }}
              transition={{ ...springFirm, delay: 0.15 + fromRight * 0.07 }}
            >
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
