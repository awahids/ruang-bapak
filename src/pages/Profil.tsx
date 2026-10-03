import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { EditProfileDialog } from "@/components/ruang/EditProfileDialog";
import { FeedPage } from "@/components/ruang/FeedPage";
import { ProfileHeader } from "@/components/ruang/ProfileHeader";
import { RuangShell } from "@/components/ruang/RuangShell";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { startConversation } from "@/lib/inbox";
import { blockUser, fetchBlockStatus, unblockUser } from "@/lib/moderation";
import {
  describeError,
  fetchProfileByUsername,
  fetchFollowStats,
  fetchIsFollowing,
  fetchProfileStats,
  setFollowing,
  getInitials,
  updateProfile,
  type AuthorFilter,
  type Profile,
  type ProfileUpdate,
} from "@/lib/social";

const formatCount = (value: number) => new Intl.NumberFormat("id-ID", { notation: "compact" }).format(value);

const DemoProfil = () => (
  <FeedPage
    pageKey="profil"
    renderHeader={() => (
      <ProfileHeader
        name="Ari Pratama"
        handle="aripratama"
        initials="AP"
        color="hsl(28 33% 41%)"
        bio="Bapak dari 2 anak yang lagi belajar jadi sabar. Suka ngopi, oprek mesin, dan dengerin podcast parenting. Mari berbagi ilmu, Pak!"
        stats={[
          { label: "Dukungan", value: "1.2k" },
          { label: "Postingan", value: "156" },
          { label: "Reputasi", value: "Bapak Hebat" }
        ]}
        onEdit={() => {}}
      />
    )}
  />
);

const CenteredMessage = ({ title, body }: { title?: string; body?: string }) => (
  <RuangShell>
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center text-muted-foreground">
      {title ? (
        <>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {body && <p className="mt-2">{body}</p>}
        </>
      ) : (
        <Loader2 className="animate-spin" aria-label="Memuat profil" />
      )}
    </div>
  </RuangShell>
);

function ProfileFeed({ profile, isOwn }: { profile: Profile; isOwn: boolean }) {
  const { refreshProfile, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const requireAuth = useRequireAuth();
  const [blockPending, setBlockPending] = useState(false);

  const { data: blockStatus } = useQuery({
    queryKey: ["block-status", user?.id ?? null, profile.id],
    queryFn: () => fetchBlockStatus(user!.id, profile.id),
    enabled: !isOwn && Boolean(user),
  });
  const blockedByMe = blockStatus?.blockedByMe ?? false;
  const blockedMe = blockStatus?.blockedMe ?? false;

  const [followPending, setFollowPending] = useState(false);

  const { data: followStats } = useQuery({
    queryKey: ["follow-stats", profile.id],
    queryFn: () => fetchFollowStats(profile.id),
  });

  const { data: following = false } = useQuery({
    queryKey: ["is-following", user?.id ?? null, profile.id],
    queryFn: () => fetchIsFollowing(user!.id, profile.id),
    enabled: !isOwn && Boolean(user),
  });

  const handleToggleFollow = async () => {
    if (!requireAuth()) return;

    setFollowPending(true);
    try {
      await setFollowing(profile.id, !following);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["is-following"] }),
        queryClient.invalidateQueries({ queryKey: ["follow-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["suggestions"] }),
      ]);
      toast.success(following ? `Berhenti mengikuti @${profile.username}` : `Mengikuti @${profile.username}`);
    } catch (error) {
      toast.error("Gagal mengubah status ikuti", { description: describeError(error) });
    } finally {
      setFollowPending(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!requireAuth()) return;
    if (!blockedByMe && !window.confirm(`Blokir @${profile.username}? Postingan dan komentarnya tidak akan tampil untuk Bapak, dan kalian tidak bisa saling kirim pesan.`)) return;

    setBlockPending(true);
    try {
      if (blockedByMe) {
        await unblockUser(profile.id);
        toast.success(`Blokir @${profile.username} dibuka`);
      } else {
        await blockUser(profile.id);
        toast.success(`@${profile.username} diblokir`);
      }
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error("Gagal mengubah blokir", { description: describeError(error) });
    } finally {
      setBlockPending(false);
    }
  };

  const handleMessage = async () => {
    if (!requireAuth()) return;

    setOpeningChat(true);
    try {
      const conversationId = await startConversation(profile.id);
      navigate(`/inbox/${conversationId}`);
    } catch (error) {
      toast.error("Percakapan gagal dibuka", { description: describeError(error) });
      setOpeningChat(false);
    }
  };

  // Your own profile includes your anonymous posts; other profiles only show named posts.
  const filter = useMemo<AuthorFilter>(
    () => (isOwn ? { kind: "author", authorId: profile.id } : { kind: "username", username: profile.username }),
    [isOwn, profile.id, profile.username],
  );

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", filter],
    queryFn: () => fetchProfileStats(filter),
  });

  const handleSave = async (changes: ProfileUpdate) => {
    await updateProfile(profile.id, changes);
    await refreshProfile();
    await queryClient.invalidateQueries();
    if (changes.username !== profile.username) navigate("/profil", { replace: true });
  };

  return (
    <>
      <FeedPage
        pageKey="profil"
        feedFilter={filter}
        showComposer={isOwn}
        emptyState={
          isOwn
            ? undefined
            : blockedByMe
              ? { title: `Postingan @${profile.username} disembunyikan`, hint: "Buka blokir untuk melihatnya lagi." }
              : { title: `@${profile.username} belum punya postingan`, hint: "Postingan anonim tidak ditampilkan di profil." }
        }
        renderHeader={() => (
          <ProfileHeader
            name={profile.display_name}
            handle={profile.username}
            initials={getInitials(profile.display_name)}
            color={profile.avatar_color}
            bio={profile.bio}
            location={profile.location}
            joinedLabel={`Bergabung ${format(new Date(profile.created_at), "MMMM yyyy", { locale: localeId })}`}
            verified={profile.verified}
            stats={[
              { label: "Pengikut", value: formatCount(followStats?.followers ?? 0) },
              { label: "Mengikuti", value: formatCount(followStats?.following ?? 0) },
              { label: "Postingan", value: formatCount(stats?.posts ?? 0) },
              { label: "Dukungan", value: formatCount(stats?.support ?? 0) },
            ]}
            onEdit={isOwn ? () => setEditing(true) : undefined}
            onMessage={isOwn || blockedByMe || blockedMe ? undefined : handleMessage}
            messagePending={openingChat}
            onToggleFollow={isOwn || blockedByMe || blockedMe ? undefined : handleToggleFollow}
            following={following}
            followPending={followPending}
            onToggleBlock={isOwn ? undefined : handleToggleBlock}
            blocked={blockedByMe}
            blockPending={blockPending}
            notice={
              blockedByMe
                ? `Bapak memblokir @${profile.username}. Postingan dan komentarnya disembunyikan untuk Bapak.`
                : blockedMe
                  ? `@${profile.username} membatasi interaksi dengan Bapak.`
                  : undefined
            }
          />
        )}
      />
      {isOwn && <EditProfileDialog profile={profile} open={editing} onOpenChange={setEditing} onSave={handleSave} />}
    </>
  );
}

function OwnProfil() {
  const { loading, user, profile } = useAuth();
  const location = useLocation();

  if (loading) return <CenteredMessage />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return <CenteredMessage title="Profil belum tersedia" body="Coba muat ulang halaman sebentar lagi, Pak." />;

  return <ProfileFeed key={profile.id} profile={profile} isOwn />;
}

function PublicProfil({ username }: { username: string }) {
  const { user } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfileByUsername(username),
  });

  if (isLoading) return <CenteredMessage />;
  if (!profile) return <CenteredMessage title="Bapak ini tidak ditemukan" body={`Belum ada pengguna dengan username @${username}.`} />;
  if (profile.id === user?.id) return <Navigate to="/profil" replace />;

  return <ProfileFeed key={profile.id} profile={profile} isOwn={false} />;
}

const Profil = () => {
  const { enabled } = useAuth();
  const { username } = useParams();

  if (!enabled) return <DemoProfil />;

  return username ? <PublicProfil username={username.toLowerCase()} /> : <OwnProfil />;
};

export default Profil;
