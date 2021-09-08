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

using Kyoo.Abstractions.Models;
using Kyoo.Utils;
using TMDbLib.Objects.Companies;
using TMDbLib.Objects.Search;

namespace Kyoo.TheMovieDb
{
	/// <summary>
	/// A class containing extensions methods to convert from TMDB's types to Kyoo's types.
	/// </summary>
	public static partial class Convertors
	{
		/// <summary>
		/// Convert a <see cref="Company"/> into a <see cref="Studio"/>.
		/// </summary>
		/// <param name="company">The company to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted company as a <see cref="Studio"/>.</returns>
		public static Studio ToStudio(this Company company, Provider provider)
		{
			return new Studio
			{
				Slug = Utility.ToSlug(company.Name),
				Name = company.Name,
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/company/{company.Id}",
						DataID = company.Id.ToString()
					}
				}
			};
		}

		/// <summary>
		/// Convert a <see cref="SearchCompany"/> into a <see cref="Studio"/>.
		/// </summary>
		/// <param name="company">The company to convert.</param>
		/// <param name="provider">The provider representing TheMovieDb.</param>
		/// <returns>The converted company as a <see cref="Studio"/>.</returns>
		public static Studio ToStudio(this SearchCompany company, Provider provider)
		{
			return new Studio
			{
				Slug = Utility.ToSlug(company.Name),
				Name = company.Name,
				ExternalIDs = new[]
				{
					new MetadataID
					{
						Provider = provider,
						Link = $"https://www.themoviedb.org/company/{company.Id}",
						DataID = company.Id.ToString()
					}
				}
			};
		}
	}
}
