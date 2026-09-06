import { motion } from 'framer-motion';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, readOnly }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating${readOnly ? ' readonly' : ''}`}>
      {stars.map((star) => (
        <motion.button
          key={star}
          type="button"
          whileTap={readOnly ? undefined : { scale: 0.85 }}
          className={value !== null && star <= value ? 'filled' : ''}
          disabled={readOnly}
          onClick={() => {
            if (readOnly || !onChange) return;
            onChange(value === star ? null : star);
          }}
          aria-label={`${star} estrellas`}
        >
          {value !== null && star <= value ? '★' : '☆'}
        </motion.button>
      ))}
    </div>
  );
}
