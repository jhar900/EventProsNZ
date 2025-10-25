'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ExternalLink,
  Calendar,
  Users,
  Heart,
} from 'lucide-react';

interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  followers?: number;
  isActive: boolean;
}

interface SocialUpdate {
  id: string;
  platform: string;
  content: string;
  image?: string;
  likes: number;
  shares: number;
  publishedAt: string;
  url: string;
}

const socialMediaLinks: SocialMediaLink[] = [
  {
    id: '1',
    platform: 'Facebook',
    url: 'https://facebook.com/eventprosnz',
    icon: 'facebook',
    followers: 2500,
    isActive: true,
  },
  {
    id: '2',
    platform: 'Instagram',
    url: 'https://instagram.com/eventprosnz',
    icon: 'instagram',
    followers: 3200,
    isActive: true,
  },
  {
    id: '3',
    platform: 'LinkedIn',
    url: 'https://linkedin.com/company/eventprosnz',
    icon: 'linkedin',
    followers: 1800,
    isActive: true,
  },
  {
    id: '4',
    platform: 'Twitter',
    url: 'https://twitter.com/eventprosnz',
    icon: 'twitter',
    followers: 1200,
    isActive: true,
  },
  {
    id: '5',
    platform: 'YouTube',
    url: 'https://youtube.com/@eventprosnz',
    icon: 'youtube',
    followers: 800,
    isActive: true,
  },
];

const socialUpdates: SocialUpdate[] = [
  {
    id: '1',
    platform: 'Instagram',
    content:
      'Check out this amazing wedding we helped plan in Queenstown! 🏔️ #EventProsNZ #QueenstownWedding',
    image: '/images/social/queenstown-wedding.jpg',
    likes: 45,
    shares: 12,
    publishedAt: '2024-12-18T10:30:00Z',
    url: 'https://instagram.com/p/xyz123',
  },
  {
    id: '2',
    platform: 'Facebook',
    content:
      'New contractor spotlight: Meet Sarah from Auckland who specializes in corporate events. Read her story on our blog!',
    likes: 23,
    shares: 8,
    publishedAt: '2024-12-17T14:15:00Z',
    url: 'https://facebook.com/eventprosnz/posts/xyz456',
  },
  {
    id: '3',
    platform: 'LinkedIn',
    content:
      "We're proud to announce our partnership with the New Zealand Event Industry Association. Together, we're raising standards across the industry.",
    likes: 67,
    shares: 15,
    publishedAt: '2024-12-16T09:00:00Z',
    url: 'https://linkedin.com/company/eventprosnz/posts/xyz789',
  },
];

const getIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return Facebook;
    case 'instagram':
      return Instagram;
    case 'linkedin':
      return Linkedin;
    case 'twitter':
      return Twitter;
    case 'youtube':
      return Youtube;
    default:
      return ExternalLink;
  }
};

export default function SocialMediaSection() {
  const [updates, setUpdates] = useState<SocialUpdate[]>([]);

  useEffect(() => {
    // Simulate fetching social media updates
    setUpdates(socialUpdates);
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Follow Us</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay connected with Event Pros NZ on social media for the latest
            updates, tips, and success stories.
          </p>
        </div>

        {/* Social Media Links */}
        <div className="grid md:grid-cols-5 gap-6 mb-16">
          {socialMediaLinks.map(link => {
            const IconComponent = getIcon(link.platform);
            return (
              <Card
                key={link.id}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{link.platform}</h3>
                  {link.followers && (
                    <p className="text-sm text-gray-600 mb-4">
                      {link.followers.toLocaleString()} followers
                    </p>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Follow
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Updates */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">
            Latest Updates
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {updates.map(update => {
              const IconComponent = getIcon(update.platform);
              return (
                <Card
                  key={update.id}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{update.platform}</span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(update.publishedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {update.content}
                    </p>
                    {update.image && (
                      <div className="mb-4">
                        <img
                          src={update.image}
                          alt="Social media post"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {update.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {update.shares}
                        </div>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <a
                        href={update.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        View Post
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Social Sharing */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Share Event Pros NZ</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Help us spread the word about Event Pros NZ to your network!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://eventprosnz.co.nz')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="w-4 h-4" />
                  Share on Facebook
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent('https://eventprosnz.co.nz')}&text=${encodeURIComponent('Check out Event Pros NZ - the best platform for event planning in New Zealand!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="w-4 h-4" />
                  Share on Twitter
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://eventprosnz.co.nz')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-4 h-4" />
                  Share on LinkedIn
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
