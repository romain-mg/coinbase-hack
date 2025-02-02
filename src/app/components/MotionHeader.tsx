"use client";

import { motion } from "framer-motion";

export function MotionHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <h1 className="text-4xl font-bold mb-4">Insights.ai wallet analyzer </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Get investment advice, measure your onchain activity and get a NFT
        representing it.
      </p>
    </motion.div>
  );
}
