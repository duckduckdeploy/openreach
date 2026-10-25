import { AtSign, Hash, MapPin, MessageCircleQuestion, UserSearch, Users } from "lucide-react";

/** The standalone tools, in the order the tools page and the sidebar show them. */
export const TOOLS = [
  { slug: "influencer-finder", title: "Influencer finder", blurb: "Creators on YouTube, TikTok and Instagram for any niche, with followers, average views, engagement and contacts.", icon: Users, group: "Influencers" },
  { slug: "creator", title: "Creator analyser", blurb: "One creator's real reach: average views, engagement rate, posting frequency, emails and links.", icon: UserSearch, group: "Influencers" },
  { slug: "lead-finder", title: "Lead finder", blurb: "Businesses on Google Maps for any search and place, filtered by website, rating, reviews and more.", icon: MapPin, group: "Leads" },
  { slug: "brand-mentions", title: "Brand mentions", blurb: "Where your product is talked about: Reddit, Hacker News, GitHub, Stack Overflow, Quora, X, LinkedIn, review sites and more.", icon: AtSign, group: "Communities" },
  { slug: "customer-finder", title: "Customer finder", blurb: "People asking for what you sell, in threads and questions across communities, ranked by buying intent.", icon: MessageCircleQuestion, group: "Communities" },
  { slug: "subreddit-finder", title: "Subreddit finder", blurb: "The subreddits where your topic comes up most, ranked by threads, replies and how recent they are.", icon: Hash, group: "Communities" },
] as const;

export const TOOL_GROUPS = ["Influencers", "Leads", "Communities"] as const;
