import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';

function youtubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function normalizeUrl(url: string): string {
  const id = youtubeVideoId(url);
  return id ? id : url.trim().toLowerCase();
}

type VideoEntry = { url: string; title?: string };

/** Same combined source as home: landing page video + video gallery */
function useVideosForPage() {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      api.get<{ landing_youtube_url?: string | null }>('/api/settings/landing'),
      api.get<{ videos: VideoEntry[] }>('/api/settings/videos'),
    ])
      .then(([landingRes, videosRes]) => {
        const landingUrl = landingRes.data?.landing_youtube_url?.trim() || null;
        const gallery = videosRes.data?.videos ?? [];
        const seen = new Set<string>();
        const combined: VideoEntry[] = [];
        if (landingUrl) {
          const key = normalizeUrl(landingUrl);
          if (!seen.has(key)) {
            seen.add(key);
            combined.push({ url: landingUrl, title: 'Featured video' });
          }
        }
        for (const v of gallery) {
          const key = normalizeUrl(v.url);
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(v);
          }
        }
        setVideos(combined);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);
  return { videos, loading };
}

export default function VideosPage() {
  const { videos, loading } = useVideosForPage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-12 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-accent-600 font-medium text-sm uppercase tracking-wider">
            Watch & Explore
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-2 mb-4">
            Video Stories
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Watch real experiences from travelers who stayed with our homestay families
          </p>
        </motion.div>

        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading videos…</p>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-primary-200 bg-primary-50/50">
            <p className="text-muted-foreground">No videos yet. Check back later.</p>
            <Link
              to="/"
              className="mt-4 inline-block text-accent-600 font-medium hover:underline"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video, index) => (
              <VideoCard key={normalizeUrl(video.url) + index} video={video} index={index} />
            ))}
          </div>
        )}

        {/* Visit channel CTA */}
        {videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all hover:scale-105"
            >
              Visit Our YouTube Channel
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, index }: { video: VideoEntry; index: number }) {
  const videoId = youtubeVideoId(video.url);
  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;
  const title = video.title?.trim() || `Video ${index + 1}`;
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : video.url;

  return (
    <motion.a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -8 }}
      className="group block cursor-pointer"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/40" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
          >
            <Play className="w-7 h-7 text-primary fill-primary ml-1" />
          </motion.div>
        </div>
      </div>
      <h3 className="font-medium text-foreground group-hover:text-accent-600 transition-colors line-clamp-2">
        {title}
      </h3>
    </motion.a>
  );
}
