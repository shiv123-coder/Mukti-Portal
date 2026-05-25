import { Star } from "lucide-react";

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 28,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-transform ${readonly ? "cursor-default" : "cursor-pointer active:scale-90"}`}
        >
          <Star
            size={size}
            className={
              star <= value
                ? "fill-primary text-primary drop-shadow-primary-glow"
                : "text-foreground"
            }
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
