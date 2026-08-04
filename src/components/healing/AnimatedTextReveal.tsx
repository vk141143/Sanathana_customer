import React from 'react';
import { motion } from 'motion/react';

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedReveal: React.FC<Props> = ({ children, className }) => (
  <motion.div variants={container} initial="hidden" animate="visible" className={className}>
    {children}
  </motion.div>
);

export const RevealItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <motion.div variants={item} className={className}>
    {children}
  </motion.div>
);
