"use client";

import { motion } from "framer-motion";

export function MotionHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <h1 className="text-4xl font-bold mb-4">Coinbase Agent Chat</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Interact with the Coinbase Developer Platform AgentKit
      </p>
    </motion.div>
  );
}