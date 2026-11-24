import { lazy } from "react";

type ImageModule = { default: string };

type LazyIconOptions = {
  hasBorder: boolean;
};

/**
 * Builds a lazy-loaded page icon.
 *
 * MUST be called at MODULE level (outside any component). A `lazy()` created
 * inside a component is a brand new component on every render, so React would
 * remount the icon (and flash the Suspense fallback) on every re-render.
 *
 * `alt` is empty on purpose: the icon only decorates the heading next to it.
 * Giving it the same text would make screen readers read the title twice (WCAG 1.1.1).
 */
export function createLazyIcon(
  loadImage: () => Promise<ImageModule>,
  options: LazyIconOptions,
) {
  const className = options.hasBorder
    ? "size-20 rounded-lg border border-[#FFD6A7]"
    : "size-20 rounded-lg";

  return lazy(() =>
    loadImage().then((module) => ({
      default: () => <img src={module.default} alt="" className={className} />,
    })),
  );
}
