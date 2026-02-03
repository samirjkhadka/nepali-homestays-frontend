import { motion } from 'framer-motion';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ReviewItem {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewer_name?: string | null;
  created_at: string;
}

export interface ReviewsSectionProps {
  reviews: ReviewItem[];
  averageRating: number;
  totalReviews: number;
}

export function ReviewsSection({ reviews, averageRating, totalReviews }: ReviewsSectionProps) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-NP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="py-8 border-t border-border">
      <div className="flex items-center gap-3 mb-8">
        <Star className="w-6 h-6 fill-accent text-accent" />
        <span className="font-display text-2xl font-semibold">{averageRating.toFixed(1)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                {(review.reviewer_name || 'Guest').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-medium text-foreground">
                  {review.reviewer_name || 'Guest'}
                </h4>
                <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>

            {review.title && (
              <p className="font-medium text-foreground">{review.title}</p>
            )}
            {review.comment && (
              <p className="text-foreground leading-relaxed">{review.comment}</p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful
              </button>
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Reply
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {totalReviews > 0 && (
        <div className="mt-8">
          <Button variant="outline" size="lg" className="font-medium">
            Show all {totalReviews} reviews
          </Button>
        </div>
      )}
    </div>
  );
}
