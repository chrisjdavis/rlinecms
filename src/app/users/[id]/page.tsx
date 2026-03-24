import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Layout } from "@/components/theme/minimal/Layout"
import { getSiteConfig } from "@/lib/site";
import { getNavigation } from "@/lib/navigation";

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "U";
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Try to find user by id or username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id },
        { username: id },
      ],
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      avatar: true,
    },
  });

  if (!user) return notFound();

  // Fetch the most recent published post for this user
  const recentPost = await prisma.post.findFirst({
    where: {
      authorId: user.id,
      status: 'PUBLISHED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      title: true,
      excerpt: true,
      slug: true,
      createdAt: true,
    },
  });

  // Fetch profile links
  const profileLinks: { id: string; title: string; url: string; order: number }[] = await prisma.profileLink.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
  });

  const site = await getSiteConfig();
  const navigation = await getNavigation();

  // Fetch user preferences
  const prefs = await prisma.userPreference.findUnique({ where: { userId: user.id } });
  if (prefs && prefs.profilePublic === false) {
    return (
      <div className="flex min-h-[60vh] justify-center items-center">
        <div className="w-full max-w-2xl rounded-lg bg-white !p-8 shadow text-center">
          <h1 className="text-2xl font-bold mb-4">This profile is private.</h1>
          <p className="text-muted-foreground text-lg">The user has chosen not to display their profile publicly.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout site={site} navigation={navigation}>
      <div className="flex min-h-[60vh] justify-center">
        <div className="w-full max-w-2xl rounded-lg bg-white !p-8 shadow space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20 mb-2">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name || user.email || "User"} />
              ) : (
                <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
              )}
            </Avatar>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.username && (
              <span className="text-muted-foreground text-sm">@{user.username}</span>
            )}
          </div>
          {user.bio && <p className="text-lg !mt-4 text-center text-muted-foreground whitespace-pre-line">{user.bio}</p>}

          {/* Most Recent Post */}
          {recentPost && (
            <article className="w-full !px-0 !py-4 border-t !mt-4">
            <div>
              <div className="space-y-2">
                <div className="text-lg font-bold text-gray-500 mb-4">
                  {format(new Date(recentPost.createdAt), 'MMMM d, yyyy')}
                </div>
                <h3 className="text-lg !mt-0 font-bold">{recentPost.title}</h3>
                {recentPost.excerpt && <p className="text-muted-foreground">{recentPost.excerpt}</p>}
                <a
                  href={`/posts/${recentPost.slug}`}
                  className="inline-block mt-2 text-primary hover:underline font-medium"
                >
                  Read more →
                </a>
              </div>
            </div>
            </article>
          )}

          {/* Profile Links */}
          {profileLinks.length > 0 && (
            <div className="w-full flex flex-col w-full gap-2 mt-6">
              <h2 className="text-lg font-semibold !mt-2 mb-2">Links</h2>
              <ul className="flex flex-col gap-5 w-full">
                {profileLinks.map((link: { id: string; title: string; url: string; order: number }) => (
                  <li key={link.id} className="flex w-full">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center justify-center shadow rounded-md hover:bg-primary !p-2 !hover:text-white !hover:no-underline"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 