using System.Collections.Generic;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// Metadata of episode currently watching by an user
	/// </summary>
	public class WatchedEpisode
	{
		/// <summary>
		/// The ID of the user that started watching this episode.
		/// </summary>
		public int UserID { get; set; }

		/// <summary>
		/// The ID of the episode started.
		/// </summary>
		public int EpisodeID { get; set; }

		/// <summary>
		/// The <see cref="Episode"/> started.
		/// </summary>
		public Episode Episode { get; set; }

		/// <summary>
		/// Where the player has stopped watching the episode (between 0 and 100).
		/// </summary>
		public int WatchedPercentage { get; set; }
	}
}
