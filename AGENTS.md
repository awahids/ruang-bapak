# Project architecture

- Keep the post detail comment thread in a dedicated `CommentTree` component, using the existing post comment data and page-level reply handlers; this isolates the animated branch presentation without changing how comments are created.