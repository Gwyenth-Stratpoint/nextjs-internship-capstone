import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-[24px] border shadow-sm", {
  variants: {
    variant: {
      default: "border-border bg-card text-card-foreground",
      glass: "glass-panel border-white/55 bg-white/40 text-foreground backdrop-blur-[28px]",
      panel: "glass-panel border-white/65 bg-white/50 text-foreground backdrop-blur-[24px]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  ),
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  ),
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);

CardFooter.displayName = "CardFooter";

type CardInsetProps = React.HTMLAttributes<HTMLElement> & {
  accentClassName?: string;
  interactive?: boolean;
  as?: "article" | "div";
};

function CardInset({
  className,
  accentClassName,
  interactive = false,
  as: Component = "article",
  children,
  ...props
}: CardInsetProps) {
  return (
    <Component
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl border border-white/90 bg-white/92 shadow-[0_16px_34px_rgba(176,186,216,0.14),0_2px_8px_rgba(196,204,226,0.1),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-md",
        interactive &&
          "cursor-pointer transition-all hover:bg-white/95 hover:shadow-[0_18px_34px_rgba(148,163,184,0.2),inset_0_1px_0_rgba(255,255,255,0.96)]",
        className,
      )}
      {...props}
    >
      {accentClassName ? (
        <div className={cn("absolute inset-x-0 top-0 h-[3px]", accentClassName)} />
      ) : null}
      {children}
    </Component>
  );
}

function CardInsetHeader({
  title,
  description,
  badge,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground">{title}</div>
        {description ? (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}

function CardMetaRow({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-3 flex items-center justify-between gap-3 text-xs", className)}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function CardBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

export {
  Card,
  CardBadge,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardInset,
  CardInsetHeader,
  CardMetaRow,
  CardTitle,
};
