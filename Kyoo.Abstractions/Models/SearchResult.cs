using System.Collections.Generic;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// Results of a search request.
	/// </summary>
	public class SearchResult
	{
		/// <summary>
		/// The query of the search request.
		/// </summary>
		public string Query { get; init; }

		/// <summary>
		/// The collections that matched the search.
		/// </summary>
		public ICollection<Collection> Collections { get; init; }

		/// <summary>
		/// The shows that matched the search.
		/// </summary>
		public ICollection<Show> Shows { get; init; }

		/// <summary>
		/// The episodes that matched the search.
		/// </summary>
		public ICollection<Episode> Episodes { get; init; }

		/// <summary>
		/// The people that matched the search.
		/// </summary>
		public ICollection<People> People { get; init; }

		/// <summary>
		/// The genres that matched the search.
		/// </summary>
		public ICollection<Genre> Genres { get; init; }

		/// <summary>
		/// The studios that matched the search.
		/// </summary>
		public ICollection<Studio> Studios { get; init; }
	}
}
