/** Minimal shape of a blog collection entry needed to list posts. */
export interface ListablePost {
	id: string;
	data: {
		date: Date;
		draft?: boolean;
	};
}

/**
 * Returns the posts to list for a locale: drafts removed, only entries whose
 * id starts with `<locale>/`, sorted newest first by `data.date`.
 * Entries with equal dates keep their input order. The input is not mutated.
 */
export const selectPosts = <T extends ListablePost>(
	posts: readonly T[],
	locale: string,
): T[] =>
	posts
		.filter((post) => !post.data.draft && post.id.split("/")[0] === locale)
		.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
