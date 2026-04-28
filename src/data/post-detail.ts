import type { FeedItem } from "./ruang-bapak";

type CommentBase = {
  id: number;
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  support: number;
  verified?: boolean;
};

export type PostReply = CommentBase;

export type PostComment = CommentBase & {
  replies: PostReply[];
};

const commentsByPostId: Record<number, PostComment[]> = {
  101: [
    {
      id: 1001,
      author: "Bapak Otomotif",
      initials: "BO",
      color: "hsl(95 20% 34%)",
      time: "18 menit yang lalu",
      text: "Kalau sekitar Jaksel, coba bengkel di area Fatmawati, Pak. Biasanya masih buka sampai jam 9 malam.",
      support: 9,
      replies: [
        {
          id: 10011,
          author: "Bapak Dua Jagoan",
          initials: "BJ",
          color: "hsl(95 22% 38%)",
          time: "12 menit yang lalu",
          text: "Siap Pak, terima kasih. Saya cek malam ini.",
          support: 4,
          verified: true,
        },
      ],
    },
    {
      id: 1002,
      author: "Ayah Siaga",
      initials: "AS",
      color: "hsl(210 22% 45%)",
      time: "10 menit yang lalu",
      text: "Saya biasanya booking dulu via WA, biar datang langsung dikerjain.",
      support: 6,
      replies: [],
    },
  ],
  301: [
    {
      id: 3001,
      author: "Bapak Belajar",
      initials: "BB",
      color: "hsl(28 33% 41%)",
      time: "34 menit yang lalu",
      text: "Kami pakai jadwal mingguan: siapa pegang antar jemput, siapa pegang urusan dapur. Jadi ekspektasi jelas.",
      support: 12,
      replies: [
        {
          id: 30011,
          author: "Bapak Tangguh",
          initials: "BT",
          color: "hsl(26 40% 42%)",
          time: "27 menit yang lalu",
          text: "Menarik Pak, berarti dibahas rutin tiap minggu ya?",
          support: 5,
          verified: true,
        },
        {
          id: 30012,
          author: "Bapak Belajar",
          initials: "BB",
          color: "hsl(28 33% 41%)",
          time: "21 menit yang lalu",
          text: "Iya Pak, biasanya Minggu malam 15 menitan.",
          support: 3,
        },
      ],
    },
  ],
};

const cloneComments = (items: PostComment[]): PostComment[] =>
  items.map((comment) => ({
    ...comment,
    replies: comment.replies.map((reply) => ({ ...reply })),
  }));

const buildDefaultComments = (post: FeedItem): PostComment[] => [
  {
    id: post.id * 100 + 1,
    author: "Bapak Satu Frekuensi",
    initials: "BF",
    color: "hsl(100 20% 34%)",
    time: "25 menit yang lalu",
    text: `Saya relate dengan topik "${post.tag}", Pak. Terima kasih sudah berbagi, sangat membantu saya juga.`,
    support: 7,
    replies: [
      {
        id: post.id * 100 + 11,
        author: "Moderator Ruang Bapak",
        initials: "MR",
        color: "hsl(96 20% 34%)",
        time: "20 menit yang lalu",
        text: "Terima kasih sudah saling menguatkan. Jaga ruang tetap hangat ya, Pak.",
        support: 4,
        verified: true,
      },
    ],
  },
  {
    id: post.id * 100 + 2,
    author: "Ayah Pendengar",
    initials: "AP",
    color: "hsl(210 22% 45%)",
    time: "11 menit yang lalu",
    text: "Setuju, ini isu yang sering terjadi dan penting dibahas bareng.",
    support: 5,
    replies: [],
  },
];

export function getPostComments(post: FeedItem): PostComment[] {
  return cloneComments(commentsByPostId[post.id] ?? buildDefaultComments(post));
}
