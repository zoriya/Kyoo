export const availableSorts = [
	"name",
	"startAir",
	"endAir",
	"createdAt",
	"rating",
] as const;
export type SortBy = (typeof availableSorts)[number];
export type SortOrd = "asc" | "desc";
