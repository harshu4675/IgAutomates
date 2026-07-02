import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCheckCircle,
  HiOutlineHeart,
  HiOutlineChatBubbleOvalLeft,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlinePlayCircle,
} from "react-icons/hi2";
import { useInstagramPosts } from "@/hooks/useInstagram";
import { formatNumber } from "@/utils/formatNumber";
import { useInView } from "react-intersection-observer";

export default function PostSelector({ accountId, selectedPost, onSelect }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInstagramPosts(accountId);

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
          Select a Post
        </h3>
        <p className="text-sm text-text-muted font-jakarta mb-6">
          Loading your Instagram posts...
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-primary-lightest/40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200">
        <p className="text-sm text-red-800 font-jakarta font-semibold mb-1">
          Failed to load posts
        </p>
        <p className="text-xs text-red-700 font-jakarta">
          {error.response?.data?.message ||
            error.message ||
            "Please try reconnecting your Instagram account."}
        </p>
      </div>
    );
  }

  const posts = data?.posts || [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <HiOutlinePhoto className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
          No posts found
        </h3>
        <p className="text-sm text-text-muted font-jakarta">
          This Instagram account has no posts yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
        Select a Post
      </h3>
      <p className="text-sm text-text-muted font-jakarta mb-6">
        Choose which post will trigger the automation.
        <span className="text-primary-dark font-semibold">
          {" "}
          {posts.length} loaded
        </span>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isSelected={selectedPost?.id === post.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      {hasNextPage && (
        <div ref={loadMoreRef} className="mt-6 py-8 text-center">
          {isFetchingNextPage ? (
            <div className="inline-flex items-center gap-2 text-sm text-text-muted font-jakarta">
              <div className="w-4 h-4 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
              Loading more posts...
            </div>
          ) : (
            <p className="text-sm text-text-muted font-jakarta">
              Scroll to load more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isSelected, onSelect }) {
  const isVideo = post.media_type === "VIDEO";
  const isCarousel = post.media_type === "CAROUSEL_ALBUM";
  const isReel = post.media_type === "REEL" || (isVideo && post.thumbnail_url);

  const imageUrl = post.thumbnail_url || post.media_url;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(post)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
        isSelected
          ? "border-primary-dark shadow-glass-lg ring-4 ring-primary-mid/20"
          : "border-transparent hover:border-primary-mid"
      }`}
    >
      <img
        src={imageUrl}
        alt={post.caption?.slice(0, 50) || "Instagram post"}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="absolute top-2 right-2 flex gap-1">
        {isReel && (
          <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <HiOutlinePlayCircle className="w-4 h-4 text-white" />
          </div>
        )}
        {isCarousel && (
          <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <HiOutlinePhoto className="w-4 h-4 text-white" />
          </div>
        )}
        {isVideo && !isReel && (
          <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <HiOutlineVideoCamera className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 bg-primary-dark/40 flex items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-glass-lg">
            <HiOutlineCheckCircle className="w-8 h-8 text-primary-dark" />
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3 text-white text-xs font-jakarta font-semibold">
          {post.like_count !== undefined && (
            <span className="flex items-center gap-1">
              <HiOutlineHeart className="w-3.5 h-3.5" />
              {formatNumber(post.like_count)}
            </span>
          )}
          {post.comments_count !== undefined && (
            <span className="flex items-center gap-1">
              <HiOutlineChatBubbleOvalLeft className="w-3.5 h-3.5" />
              {formatNumber(post.comments_count)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
