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
using System.Text.RegularExpressions;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using Microsoft.AspNetCore.Mvc;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// A common API containing custom methods to help inheritors.
	/// </summary>
	public abstract class BaseApi : ControllerBase
	{
		/// <summary>
		/// Construct and return a page from an api.
		/// </summary>
		/// <param name="resources">The list of resources that should be included in the current page.</param>
		/// <param name="limit">
		/// The max number of items that should be present per page. This should be the same as in the request,
		/// it is used to calculate if this is the last page and so on.
		/// </param>
		/// <typeparam name="TResult">The type of items on the page.</typeparam>
		/// <returns>A Page representing the response.</returns>
		protected Page<TResult> Page<TResult>(ICollection<TResult> resources, int limit)
			where TResult : IResource
		{
			Dictionary<string, string> query = Request.Query.ToDictionary(
				x => x.Key,
				x => x.Value.ToString(),
				StringComparer.InvariantCultureIgnoreCase
			);

			// If the query was sorted randomly, add the seed to the url to get reproducible links (next,prev,first...)
			if (query.ContainsKey("sortBy"))
			{
				object seed = HttpContext.Items["seed"]!;

				query["sortBy"] = Regex.Replace(query["sortBy"], "random(?!:)", $"random:{seed}");
			}
			return new Page<TResult>(
				resources,
				Request.Path,
				query,
				limit
			);
		}

		protected SearchPage<TResult> SearchPage<TResult>(SearchPage<TResult>.SearchResult result)
			where TResult : IResource
		{
			Dictionary<string, string> query = Request.Query.ToDictionary(
				x => x.Key,
				x => x.Value.ToString(),
				StringComparer.InvariantCultureIgnoreCase
			);

			string self = Request.Path + query.ToQueryString();
			string? previous = null;
			string? next = null;
			string first;
			int limit = query.TryGetValue("limit", out string? limitStr) ? int.Parse(limitStr) : new SearchPagination().Limit;
			int? skip = query.TryGetValue("skip", out string? skipStr) ? int.Parse(skipStr) : null;

			if (skip != null)
			{
				query["skip"] = Math.Max(0, skip.Value - limit).ToString();
				previous = Request.Path + query.ToQueryString();
			}
			if (result.Items.Count == limit && limit > 0)
			{
				int newSkip = skip.HasValue ? skip.Value + limit : limit;
				query["skip"] = newSkip.ToString();
				next = Request.Path + query.ToQueryString();
			}

			query.Remove("skip");
			first = Request.Path + query.ToQueryString();

			return new SearchPage<TResult>(
				result,
				self,
				previous,
				next,
				first
			);
		}
	}
}
