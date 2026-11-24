import { Suspense, type ReactNode } from "react";
import LoadingFallback from "./LoadingFallback";

// The font size follows the heading level, so a page can never render an <h2>
// as big as an <h1>. To support another level, add it here and in the prop type.
const FONT_SIZE_CLASS = {
  h1: "h1-font-size",
  h2: "h2-font-size",
} as const;

type PageHeadingProps = {
  id: string; // referenced by the page with aria-labelledby
  title: string;
  headingTag?: "h1" | "h2";
  icon?: ReactNode; // a lazy icon (see createLazyIcon)
  breakAll?: boolean; // break long words at any character (narrow screens)
  className?: string; // page-specific spacing/borders
};

export default function PageHeading(props: PageHeadingProps) {
  const { headingTag = "h1", breakAll = false, className = "" } = props;
  const HeadingTag = headingTag;

  // `order-1` puts the icon BEFORE the title visually, as in the old pages.
  const baseHeadingClass = `${FONT_SIZE_CLASS[headingTag]} text-center order-1`;
  const headingClass = breakAll
    ? `${baseHeadingClass} break-all`
    : baseHeadingClass;

  return (
    <header className={`page-heading ${className}`}>
      <HeadingTag id={props.id} className={headingClass}>
        {props.title}
      </HeadingTag>
      {props.icon && (
        <Suspense fallback={<LoadingFallback />}>{props.icon}</Suspense>
      )}
    </header>
  );
}
