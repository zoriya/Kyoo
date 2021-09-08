// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Utils;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A page of resource that contains information about the pagination of resources.
	/// </summary>
	/// <typeparam name="T">The type of resource contained in this page.</typeparam>
	public class Page<T>
		where T : IResource
	{
		/// <summary>
		/// The link of the current page.
		/// </summary>
		public Uri This { get; }

		/// <summary>
		/// The link of the first page.
		/// </summary>
		public Uri First { get; }

		/// <summary>
		/// The link of the next page.
		/// </summary>
		public Uri Next { get; }

		/// <summary>
		/// The number of items in the current page.
		/// </summary>
		public int Count => Items.Count;

		/// <summary>
		/// The list of items in the page.
		/// </summary>
		public ICollection<T> Items { get; }

		/// <summary>
		/// Create a new <see cref="Page{T}"/>.
		/// </summary>
		/// <param name="items">The list of items in the page.</param>
		/// <param name="this">The link of the current page.</param>
		/// <param name="next">The link of the next page.</param>
		/// <param name="first">The link of the first page.</param>
		public Page(ICollection<T> items, Uri @this, Uri next, Uri first)
		{
			Items = items;
			This = @this;
			Next = next;
			First = first;
		}

		/// <summary>
		/// Create a new <see cref="Page{T}"/> and compute the urls.
		/// </summary>
		/// <param name="items">The list of items in the page.</param>
		/// <param name="url">The base url of the resources available from this page.</param>
		/// <param name="query">The list of query strings of the current page</param>
		/// <param name="limit">The number of items requested for the current page.</param>
		public Page(ICollection<T> items,
			Uri url,
			Dictionary<string, string> query,
			int limit)
		{
			Items = items;
			This = new Uri(url + query.ToQueryString());

			if (items.Count == limit && limit > 0)
			{
				query["afterID"] = items.Last().ID.ToString();
				Next = new Uri(url + query.ToQueryString());
			}

			query.Remove("afterID");
			First = new Uri(url + query.ToQueryString());
		}
	}
}
