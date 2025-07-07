import { cn } from "@/lib/utils";
import Image from "next/image";

export interface TestimonialAuthor {
  name: string;
  handle: string;
  avatar: string;
}

interface TestimonialCardProps {
  author: TestimonialAuthor;
  text: string;
  href?: string;
}

export function TestimonialCard({ author, text, href }: TestimonialCardProps) {
  const Card = href ? 'a' : 'div';
  
  return (
    <Card
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group/card flex w-[360px] shrink-0 flex-col justify-between gap-4 rounded-xl bg-muted/50 p-6 text-left transition-all duration-300",
        href && "cursor-pointer hover:bg-muted"
      )}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{text}</p>
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image
              src={author.avatar}
              alt={author.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{author.name}</p>
            <p className="text-sm text-muted-foreground">{author.handle}</p>
          </div>
        </div>
      </div>
    </Card>
  );
} 