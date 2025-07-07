"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Send, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AuthorProps {
  name: string;
  bio: string;
  image: string;
  website?: string;
  twitter?: string;
}

interface ArticleFooterProps {
  title: string;
  url: string;
  author?: AuthorProps;
}

export function ArticleFooter({ title, url, author }: ArticleFooterProps) {
  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  const socialShareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
  };

  const handleShare = (platform: string) => {
    const link = socialShareLinks[platform as keyof typeof socialShareLinks];
    if (link) {
      window.open(link, '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  // Default author if none provided
  const defaultAuthor: AuthorProps = {
    name: "Team",
    bio: "Analista di politiche pubbliche originario di Palermo. Il suo lavoro analizza come le amministrazioni locali siciliane influenzino l’occupazione, la mobilità e l’innovazione civica nella regione.",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&auto=format",
  };

  const displayAuthor = author || defaultAuthor;

  return (
    <div className="mt-12 border-t pt-8">
      {/* Share Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-foreground">Condividi questo articolo</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('facebook')}
            className="w-12 h-12 rounded-full hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 transition-colors"
            aria-label="Share on Facebook"
          >
            <Facebook className="w-5 h-5 text-blue-600" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('twitter')}
            className="w-12 h-12 rounded-full hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-950 transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter className="w-5 h-5 text-gray-800 dark:text-gray-200" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('linkedin')}
            className="w-12 h-12 rounded-full hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 transition-colors"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="w-5 h-5 text-blue-700" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleShare('telegram')}
            className="w-12 h-12 rounded-full hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 transition-colors"
            aria-label="Share on Telegram"
          >
            <Send className="w-5 h-5 text-blue-500" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
            className="w-12 h-12 rounded-full hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950 transition-colors"
            aria-label="Copy link"
          >
            <ExternalLink className="w-5 h-5 text-purple-600" />
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Author Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-foreground">Scritto da</h3>
        <Card className="p-6">
          <div className="flex gap-4">
            {/* Author Image - Rounded */}
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={displayAuthor.image}
                  alt={displayAuthor.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback to a default avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format';
                  }}
                />
              </div>
            </div>
            
            {/* Author Info */}
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-foreground mb-2">
                {displayAuthor.name}
              </h4>
              <p className="text-muted-foreground mb-3 leading-relaxed">
                {displayAuthor.bio}
              </p>
              
              {/* Author Social Links */}
              <div className="flex gap-2">
                {displayAuthor.website && (
                  <Link 
                    href={displayAuthor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full hover:bg-muted"
                      aria-label="Visit website"
                    >
                      <Globe className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                
                {displayAuthor.twitter && (
                  <Link 
                    href={displayAuthor.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-full hover:bg-muted"
                      aria-label="Follow on Twitter"
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 