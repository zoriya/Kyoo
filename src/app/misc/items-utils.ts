import { ItemType, LibraryItem } from "../models/resources/library-item";
import { Show, ShowRole } from "../models/resources/show";
import { Collection } from "../models/resources/collection";
import { People } from "../models/resources/people";

export class ItemsUtils
{
	static getLink(item: LibraryItem | Show | ShowRole | Collection): string
	{
		if ("type" in item && item.type === ItemType.Collection)
			return "/collection/" + item.slug;
		else
			return "/show/" + item.slug;
	}

	static getDate(item: LibraryItem | Show | ShowRole | Collection | People): string
	{
		if ("role" in item && item.role)
		{
			if ("type" in item && item.type)
				return `as ${item.role} (${item.type})`;
			return `as ${item.role}`;
		}
		if ("type" in item && item.type && typeof item.type === "string")
			return item.type;

		if (!("startAir" in item))
			return "";
		if (item.endAir && item.startAir !== item.endAir)
			return `${item.startAir.getFullYear()} - ${item.endAir.getFullYear()}`;
		return item.startAir?.getFullYear().toString();
	}
}
