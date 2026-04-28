import { FeedPage } from "@/components/ruang/FeedPage";
import { ProfileHeader } from "@/components/ruang/ProfileHeader";

const Profil = () => {
  return (
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
        />
      )}
    />
  );
};

export default Profil;
