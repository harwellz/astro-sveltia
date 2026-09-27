import { describe, expect, test } from "vitest";
import { selectPosts } from "../content";

const post = (id: string, date: string, draft = false) => ({
	id,
	data: { title: id, date: new Date(date), draft },
});

describe("selectPosts", () => {
	test("hides draft posts", () => {
		const posts = [
			post("en/published", "2025-01-01"),
			post("en/draft", "2025-02-01", true),
		];

		expect(selectPosts(posts, "en").map((p) => p.id)).toEqual(["en/published"]);
	});

	test("excludes posts from other locales", () => {
		const posts = [
			post("en/hello", "2025-01-01"),
			post("es/hola", "2025-01-02"),
			post("english/not-a-locale", "2025-01-03"),
		];

		expect(selectPosts(posts, "en").map((p) => p.id)).toEqual(["en/hello"]);
	});

	test("sorts newest first", () => {
		const posts = [
			post("en/old", "2024-01-01"),
			post("en/newest", "2025-06-01"),
			post("en/middle", "2025-01-01"),
		];

		expect(selectPosts(posts, "en").map((p) => p.id)).toEqual([
			"en/newest",
			"en/middle",
			"en/old",
		]);
	});

	test("keeps input order for posts with equal dates", () => {
		const posts = [
			post("en/first", "2025-01-01"),
			post("en/second", "2025-01-01"),
			post("en/third", "2025-01-01"),
		];

		expect(selectPosts(posts, "en").map((p) => p.id)).toEqual([
			"en/first",
			"en/second",
			"en/third",
		]);
	});

	test("does not mutate the input array", () => {
		const posts = [post("en/old", "2024-01-01"), post("en/new", "2025-01-01")];
		const snapshot = posts.map((p) => p.id);

		selectPosts(posts, "en");

		expect(posts.map((p) => p.id)).toEqual(snapshot);
	});
});
