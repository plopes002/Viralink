// path: src/domain/posts/postConverter.ts

import { PostDocument } from "./postTypes";

export const postConverter: FirebaseFirestore.FirestoreDataConverter<PostDocument> =
  {
    toFirestore(post: PostDocument): FirebaseFirestore.DocumentData {
      return post;
    },
    fromFirestore(
      snapshot: FirebaseFirestore.QueryDocumentSnapshot,
    ): PostDocument {
      return snapshot.data() as PostDocument;
    },
  };
