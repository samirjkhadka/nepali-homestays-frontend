import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

const HOME_VIDEOS_LIMIT = 4;

function youtubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export type VideoEntry = { url: string; title?: string };

/** Normalize URL for dedupe (same video ID = same video) */
function normalizeUrl(url: string): string {
  const id = youtubeVideoId(url);
  return id ? id : url.trim().toLowerCase();
}

/**
 * Videos for home: landing page video (if set) + video gallery.
 * Deduplicated so the same URL doesn't appear twice.
 */
function useVideosForHome() {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
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
      .catch(() => setVideos([]));
  }, []);
  return videos;
}

export default function YouTubeSection() {
  const videos = useVideosForHome();
  const displayVideos = videos.slice(0, HOME_VIDEOS_LIMIT);

  if (videos.length === 0) return null;

  return (
    <section className="py-20 bg-secondary">
      <div className="container px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-accent-600 font-medium text-sm uppercase tracking-wider">
            Watch & Explore
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-secondary-foreground mt-2 mb-4">
            Video Stories
          </h2>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Watch real experiences from travelers who stayed with our homestay families
          </p>
        </motion.div>

        {/* Video Grid - up to 4 cards on home */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayVideos.map((video, index) => (
            <VideoCard key={normalizeUrl(video.url) + index} video={video} index={index} />
          ))}
        </div>

        {/* View all videos - always visible when section is shown */}
        <div className="mt-12 flex justify-center">
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white font-semibold rounded-full hover:bg-accent-600 transition-all hover:scale-105 shadow-md"
          >
            View all videos
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group block cursor-pointer"
    >
      {/* Thumbnail */}
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

      {/* Info */}
      <h3 className="font-medium text-secondary-foreground group-hover:text-accent-600 transition-colors line-clamp-2">
        {title}
      </h3>
    </motion.a>
  );
}
