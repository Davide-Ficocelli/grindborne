const TONE_CLASS = {
  white: "after:from-[#FFFFFF] after:to-[#111]",
  orange: "after:from-orange-100 after:to-[#111]",
} as const;

type GradientDividerProps = {
  tone: keyof typeof TONE_CLASS;
  className?: string;
};

// Purely decorative line, hidden from assistive technologies.
export default function GradientDivider(props: GradientDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={`bottom-linear-gradient-border ${TONE_CLASS[props.tone]} ${props.className ?? ""}`}
    />
  );
}
