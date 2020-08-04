import {ItemType, LibraryItem} from "../../models/library-item";
import {Show, ShowRole} from "../../models/show";
import {Collection} from "../../models/collection";

export class ItemsUtils
{
	static getLink(item: LibraryItem | Show | ShowRole | Collection): string
	{
		if ("type" in item && item.type == ItemType.Collection)
			return "/collection/" + item.slug;
		else
			return "/show/" + item.slug;
	}

	static getDate(item: LibraryItem | Show | ShowRole | Collection): string
	{
		if ("role" in item && item.role)
		{
			if ("type" in item && item.type)
				return `as ${item.role} (${item.type})`;
			return `as ${item.role}`;
		}
		if ("type" in item && item.type && typeof item.type == "string")
			return item.type;

		if (item.endYear && item.startYear != item.endYear)
			return `${item.startYear} - ${item.endYear}`
		return item.startYear?.toString();
	}
}