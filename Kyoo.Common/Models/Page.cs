using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Models
{
	public class Page<T> where T : IResource
	{
		public string This { get; set; }
		public string First { get; set; }
		public string Next { get; set; }

		public int Count => Items.Count;
		public ICollection<T> Items { get; set; }

		public Page() { }

		public Page(ICollection<T> items)
		{
			Items = items;
		}

		public Page(ICollection<T> items, string @this, string next, string first)
		{
			Items = items;
			This = @this;
			Next = next;
			First = first;
		}

		public Page(ICollection<T> items, 
			string url,
			Dictionary<string, string> query,
			int limit)
		{
			Items = items;
			This = url + query.ToQueryString();

			if (items.Count == limit && limit > 0)
			{
				query["afterID"] = items.Last().ID.ToString();
				Next = url + query.ToQueryString();
			}
			
			query.Remove("afterID");
			First = url + query.ToQueryString();
		}
	}
}