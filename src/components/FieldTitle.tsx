import type { ElementType, ReactNode } from "react";

const HEADING_TAGS = { 2: "h2", 3: "h3", 4: "h4" } as const;

type FieldTitleProps = {
  children: ReactNode;
  // Give it when the title names a form control: it is rendered as a <label>.
  htmlFor?: string;
  // Otherwise it is a heading. The level depends on the page (an <h2> page
  // heading needs <h3> fields below it, to keep a valid outline for WCAG).
  headingLevel?: 2 | 3 | 4;
};

export default function FieldTitle(props: FieldTitleProps) {
  const { htmlFor, headingLevel = 3 } = props;
  const Tag: ElementType = htmlFor ? "label" : HEADING_TAGS[headingLevel];

  return (
    <Tag htmlFor={htmlFor} className="field-title">
      {props.children}
    </Tag>
  );
}
