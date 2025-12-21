/**
 * 统一动画组件库
 * 
 * 使用方法:
 * 1. 直接使用预设动画配置:
 *    import { EASING, DURATION, buttonHover, modalVariants } from '@/utils/animations';
 *    <motion.button {...buttonHover}>点击</motion.button>
 * 
 * 2. 使用封装的动画组件:
 *    import { FadeIn, AnimatedPage, ModalBackdrop } from '@/components/AnimatedComponents';
 *    <FadeIn delay={0.2}>内容</FadeIn>
 * 
 * 3. 新建页面时，使用 AnimatedPage 包裹：
 *    <AnimatedPage className="p-4">页面内容</AnimatedPage>
 * 
 * 4. 模态框使用：
 *    <ModalBackdrop onClick={onClose}>
 *      <ModalContent>模态框内容</ModalContent>
 *    </ModalBackdrop>
 * 
 * 可用组件:
 * - AnimatedPage: 页面容器动画
 * - AnimatedCardContainer: 卡片容器动画（登录、404等）
 * - AnimatedList / AnimatedListItem: 列表交错动画
 * - FadeIn / ScaleIn / BounceIn / SlideIn / RotateIn: 入场动画
 * - HoverScale / HoverBounce: 悬浮效果
 * - ModalBackdrop / ModalContent: 模态框动画
 * - CloseButton: 带旋转动画的关闭按钮
 * - Shake: 摇晃动画
 */

import { motion } from 'framer-motion';
import animations, {
  EASING,
  DURATION,
  SPRING,
  listContainerVariants,
  listItemVariants,
  fadeInUp,
  scaleIn,
  bounceIn,
  buttonHover,
  cardHover,
  pageVariants,
  pageTransition,
  cardContainerVariants,
  cardContainerTransition,
  modalVariants,
  modalTransition,
  backdropVariants,
  backdropTransition,
  closeButtonHover,
  withDelay,
  withIndex,
} from '../utils/animations';

// 重新导出所有动画配置，方便其他组件使用
export { default as animations } from '../utils/animations';
export * from '../utils/animations';

/**
 * 动画列表容器
 * 为子元素提供交错入场动画
 */
export function AnimatedList({ 
  children, 
  className = '',
  staggerDelay = 0.05,
  ...props 
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 动画列表项
 * 配合 AnimatedList 使用
 */
export function AnimatedListItem({ 
  children, 
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      variants={listItemVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 淡入动画包装器
 */
export function FadeIn({ 
  children, 
  delay = 0, 
  duration = DURATION.normal,
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay, 
        duration,
        ease: EASING.bounce
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 缩放入场动画
 */
export function ScaleIn({ 
  children, 
  delay = 0, 
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay, 
        duration: DURATION.normal,
        ease: EASING.bounce
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 弹跳入场动画
 */
export function BounceIn({ 
  children, 
  delay = 0, 
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay,
        ...SPRING.stiff,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 滑入动画 (从指定方向)
 */
export function SlideIn({ 
  children, 
  direction = 'up', // 'up' | 'down' | 'left' | 'right'
  delay = 0,
  distance = 20,
  className = '',
  ...props 
}) {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      className={className}
      initial={{ 
        opacity: 0, 
        ...directions[direction]
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        delay,
        duration: DURATION.normal,
        ease: EASING.bounce
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 悬浮效果包装器
 */
export function HoverScale({ 
  children, 
  scale = 1.02,
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        scale,
        transition: { duration: DURATION.fast, ease: EASING.bounce }
      }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Q弹悬浮效果
 */
export function HoverBounce({ 
  children, 
  y = -4,
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        y,
        transition: { duration: DURATION.fast, ease: EASING.bounce }
      }}
      whileTap={{ 
        y: y / 2, 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 页面容器动画包装器
 * 用于包裹整个页面内容
 */
export function AnimatedPage({ 
  children, 
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={pageVariants.initial}
      animate={pageVariants.animate}
      exit={pageVariants.exit}
      transition={pageTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 卡片容器动画（用于登录、404等独立页面）
 */
export function AnimatedCardContainer({ 
  children, 
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={cardContainerVariants.initial}
      animate={cardContainerVariants.animate}
      transition={cardContainerTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 模态框背景
 */
export function ModalBackdrop({ 
  children, 
  onClick,
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={backdropVariants.initial}
      animate={backdropVariants.animate}
      exit={backdropVariants.exit}
      transition={backdropTransition}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 模态框内容
 */
export function ModalContent({ 
  children, 
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={modalVariants.initial}
      animate={modalVariants.animate}
      exit={modalVariants.exit}
      transition={modalTransition}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 关闭按钮（带旋转动画）
 */
export function CloseButton({ 
  children, 
  onClick,
  className = '',
  ...props 
}) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      {...closeButtonHover}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * 旋转入场（Logo、图标）
 */
export function RotateIn({ 
  children, 
  delay = 0,
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ 
        delay,
        ...SPRING.normal
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 摇晃动画（错误提示等）
 */
export function Shake({ 
  children,
  trigger = true,
  className = '',
  ...props 
}) {
  return (
    <motion.div
      className={className}
      animate={trigger ? { rotate: [0, -10, 10, -10, 0] } : {}}
      transition={{ duration: DURATION.slow, ease: "easeInOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
