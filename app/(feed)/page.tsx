import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Bookmark,
  Camera,
  Heart,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';

import { auth } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const posts = [
  {
    id: 1,
    author: {
      name: 'Kamila Hartono',
      handle: '@kamila',
      avatar: 'https://i.pravatar.cc/150?img=47',
    },
    time: '2h ago',
    content:
      "Explored the coastal boardwalk this morning and the sunrise was unreal. Can't wait to share more shots from this series!",
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    tags: ['sunrise', 'travel', 'aerial'],
    stats: { likes: 482, comments: 38, shared: 17 },
  },
  {
    id: 2,
    author: {
      name: 'Nico Prakoso',
      handle: '@nico.prk',
      avatar: 'https://i.pravatar.cc/150?img=56',
    },
    time: '5h ago',
    content:
      'Mood board for our next concept shoot: luminous neons meets minimalist architecture. Who wants to collaborate?',
    image:
      'https://images.unsplash.com/photo-1529421308418-eab98824c43f?auto=format&fit=crop&w=1400&q=80',
    tags: ['creative', 'behindthescenes'],
    stats: { likes: 305, comments: 26, shared: 12 },
  },
  {
    id: 3,
    author: {
      name: 'Anisa Fajar',
      handle: '@anisaf',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    time: '1d ago',
    content:
      'Weekend photo walk with the community. Loving how the reflections turned out with the new lens.',
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80',
    tags: ['community', 'photo walk'],
    stats: { likes: 628, comments: 54, shared: 21 },
  },
];

const suggestions = [
  {
    name: 'Amina Setia',
    role: 'Portrait Artist',
    mutuals: 8,
    avatar: 'https://i.pravatar.cc/100?img=33',
  },
  {
    name: 'Rey Pradana',
    role: 'Street Photographer',
    mutuals: 4,
    avatar: 'https://i.pravatar.cc/100?img=18',
  },
  {
    name: 'Zita Sagara',
    role: 'Digital Storyteller',
    mutuals: 12,
    avatar: 'https://i.pravatar.cc/100?img=44',
  },
];

const trendingTopics = [
  { title: '#twilightsessions', volume: '18.4K posts' },
  { title: '#glassandsteel', volume: '12.1K posts' },
  { title: '#afterhours', volume: '9.9K posts' },
];

export default async function FeedPage() {
  const session = await auth();
  const user = session?.user;
  const displayName = user?.name ?? 'Explorer';
  const firstName = displayName.split(' ')[0] ?? displayName;
  const initials =
    `${displayName.charAt(0)}${displayName.split(' ')[1]?.charAt(0) ?? ''}`.trim().toUpperCase() ||
    'SP';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <Card className="bg-gradient-to-br from-primary/15 via-background to-background">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-primary/40">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={displayName} />
                ) : (
                  <AvatarFallback>{initials}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle className="text-xl">Welcome back, {firstName}</CardTitle>
                <CardDescription>
                  Share a moment with your circle or discover what friends captured today.
                </CardDescription>
              </div>
            </div>
            <Button variant="soft" className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              Inspire me
            </Button>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary/30 bg-background/80 p-4 shadow-inner">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input placeholder="Tell your friends what's new" className="bg-background/60" />
                <div className="flex gap-2">
                  <Button variant="soft" size="icon" aria-label="Upload photo">
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Publish post
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="muted">Add tags</Badge>
                <Badge variant="muted">Schedule</Badge>
                <Badge variant="muted">Share to stories</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="foryou" className="w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="foryou">For you</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
              <TabsTrigger value="communities">Communities</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              128 friends active now
            </div>
          </div>

          <TabsContent value="foryou" className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden p-0">
                <div className="flex flex-col gap-4 p-6">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={post.author.avatar} alt={post.author.name} />
                      <AvatarFallback>{post.author.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href="#" className="text-sm font-semibold text-foreground">
                          {post.author.name}
                        </Link>
                        <span className="text-sm text-muted-foreground">{post.author.handle}</span>
                        <span className="text-xs text-muted-foreground">• {post.time}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{post.content}</p>
                      <div className="flex gap-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Save post">
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.content}
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                    sizes="(min-width: 1024px) 700px, 100vw"
                  />
                </div>
                <CardFooter className="p-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="flex items-center gap-2 font-medium text-foreground transition hover:text-primary">
                      <Heart className="h-4 w-4" /> {post.stats.likes}
                    </button>
                    <button className="flex items-center gap-2 transition hover:text-primary">
                      <MessageCircle className="h-4 w-4" /> {post.stats.comments}
                    </button>
                    <button className="flex items-center gap-2 transition hover:text-primary">
                      <Share2 className="h-4 w-4" /> {post.stats.shared}
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2 text-sm">
                    View story
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="following" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Following feed</CardTitle>
                <CardDescription>
                  Curated posts from the people you follow closely. Content will appear here as soon
                  as they share something new.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                  <p>
                    Stay tuned—invite more friends or discover creators to keep this space vibrant.
                    New updates will land here automatically.
                  </p>
                  <Button variant="soft" className="w-fit">
                    Discover creators
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Communities</CardTitle>
                <CardDescription>
                  Join curated spaces around photography, travel, design, and more to personalise
                  your feed even further.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {['Urban Explorers', 'Analog Collective', 'Night Lens', 'Waves & Trails'].map(
                  (community) => (
                    <div
                      key={community}
                      className="rounded-xl border border-border/60 bg-secondary/20 p-4 shadow-sm"
                    >
                      <h4 className="text-sm font-semibold text-foreground">{community}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        2.3k members · Active daily
                      </p>
                      <Button variant="soft" size="sm" className="mt-3">
                        Join community
                      </Button>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <aside className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Suggested connections</CardTitle>
            <CardDescription>Creators you might know or admire.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={suggestion.avatar} alt={suggestion.name} />
                    <AvatarFallback>{suggestion.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{suggestion.role}</p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.mutuals} mutual connections
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Add friend
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending topics</CardTitle>
            <CardDescription>Catch up with what the community is talking about.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {trendingTopics.map((topic) => (
              <div key={topic.title} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{topic.title}</p>
                  <p className="text-xs text-muted-foreground">{topic.volume}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-sm">
                  Follow
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/60 to-background">
          <CardHeader>
            <CardTitle>Pro tips</CardTitle>
            <CardDescription>Level up your storytelling and reach.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4 text-sm text-muted-foreground">
            <p>
              Schedule posts for the golden hour to maximise engagement. Play with the new cinematic
              filter pack in the editor to give your shots extra depth.
            </p>
            <Button variant="soft">Explore insights</Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
