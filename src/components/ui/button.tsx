import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-body active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:shadow-elevated hover:bg-primary/92 hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background/80 backdrop-blur-sm hover:bg-muted/80 hover:border-primary/25 hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/88 hover:-translate-y-0.5 shadow-soft",
        ghost: "rounded-lg hover:bg-muted/70 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline rounded-none active:scale-100",
        hero:
          "gradient-hero text-primary-foreground shadow-soft hover:shadow-glow font-display text-base hover:-translate-y-0.5 hover:scale-[1.02]",
        festiveOutline:
          "border-2 border-primary/90 bg-background/50 text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground hover:border-primary font-display text-base hover:-translate-y-0.5 hover:shadow-soft",
        green: "gradient-green text-secondary-foreground shadow-soft hover:opacity-95 hover:-translate-y-0.5",
        gold: "gradient-gold text-accent-foreground hover:opacity-95 hover:-translate-y-0.5 shadow-soft",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
