using Kyoo.Models;
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
				ExternalIDs = new []
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