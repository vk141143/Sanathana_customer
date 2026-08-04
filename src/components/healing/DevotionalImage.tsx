import React from 'react';
import { motion } from 'motion/react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export const DevotionalImage: React.FC<Props> = ({ src, alt, className = '' }) => (
  <motion.div
    className={`overflow-hidden rounded-2xl ${className}`}
    initial={{ opacity: 0, scale: 1.04, y: 15, filter: 'blur(8px)' }}
    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
  >
    <motion.img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      animate={{ scale: [1, 1.015, 1] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.div>
);
