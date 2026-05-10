"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import Image from "next/image";
import { TravelCard } from "@/lib/data";

type Props = {
  card: TravelCard;
  isTop: boolean;
  onSwipe: (direction: "like" | "skip") => void;
};

export default function SwipeCard({ card, isTop, onSwipe }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, -20], [1, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 100) onSwipe("like");
    else if (info.offset.x < -100) onSwipe("skip");
  }

  return (
    <motion.div
      className="swipe-card"
      style={{ x, rotate }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={isTop ? {} : { scale: 0.95, y: 12 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileDrag={{ scale: 1.02 }}
    >
      <div className="swipe-card__inner">
        <Image
          src={card.imageUrl}
          alt={card.location}
          fill
          className="swipe-card__image"
          draggable={false}
          priority={isTop}
        />

        <div className="swipe-card__overlay" />

        {isTop && (
          <motion.div className="swipe-card__badge--yes" style={{ opacity: likeOpacity }}>
            <span className="swipe-card__badge-label">YES</span>
          </motion.div>
        )}

        {isTop && (
          <motion.div className="swipe-card__badge--skip" style={{ opacity: skipOpacity }}>
            <span className="swipe-card__badge-label">SKIP</span>
          </motion.div>
        )}

        <div className="swipe-card__info">
          <p className="swipe-card__location">{card.location}</p>
        </div>
      </div>
    </motion.div>
  );
}
