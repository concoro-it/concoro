import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toItalianSentenceCase } from '@/lib/utils/italian-capitalization'

interface BlogPost {
  id: string
  title: string
  summary: string
  imageUrl: string
  date: string
  readTime: string
  category: string
}

interface BlogSectionProps {
  posts: BlogPost[]
}

export function BlogSection({ posts }: BlogSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-lg shadow p-6">
      {/* Left side - Title and CTA */}
      <div className="lg:col-span-4 flex flex-col justify-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Read on blog</h2>
          <p className="text-muted-foreground">
            Life lies in exercise, exercise in exercise! Eight abs are not born, 
            the perfect physique is exercised, if you want to have a fit figure, 
            you have to work hard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="default" size="lg" className="w-full sm:w-auto">
              Start Now
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            Health assistant
          </div>
        </div>
      </div>

      {/* Right side - Blog Posts */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <div className="relative h-48">
              <Image
                src={post.imageUrl}
                alt={toItalianSentenceCase(post.title)}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
                  {toItalianSentenceCase(post.category)}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <time>{new Date(post.date).toLocaleDateString()}</time>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h3 className="font-semibold line-clamp-2">{toItalianSentenceCase(post.title)}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {toItalianSentenceCase(post.summary)}
              </p>
              <Link 
                href={`/blog/${post.id}`} 
                className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
              >
                Read More
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
} 