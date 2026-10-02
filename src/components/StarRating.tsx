import { useState } from 'react';
import { motion } from 'framer-motion';
import { StarGlyph } from './Icon';
import { springLively } from '../lib/motion';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, readOnly }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;

  if (readOnly) {
    return (
      <div className="star-rating readonly" role="img" aria-label={value === null ? 'Sin puntuación' : `${value} de 5`}>
        {stars.map((star) => (
          <span key={star} style={{ lineHeight: 0, opacity: value !== null && star <= value ? 1 : 0.35 }}>
            <StarGlyph filled={value !== null && star <= value} size={15} />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="star-rating" role="radiogroup" aria-label="Valoración" onMouseLeave={() => setHover(null)}>
      {stars.map((star) => {
        const filled = shown !== null && star <= shown;
        return (
          <motion.button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
            className={filled ? 'filled' : ''}
            onMouseEnter={() => setHover(star)}
            whileTap={{ scale: 0.8 }}
            onClick={() => onChange?.(value === star ? null : star)}
          >
            {/* Al fijar una valoración, las estrellas se estampan en cadena */}
            <motion.span
              key={`${star}-${value !== null && star <= value}`}
              style={{ display: 'inline-flex' }}
              initial={value !== null && star <= value ? { scale: 0.5, rotate: -25 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springLively, delay: (star - 1) * 0.035 }}
            >
              <StarGlyph filled={filled} size={22} />
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
