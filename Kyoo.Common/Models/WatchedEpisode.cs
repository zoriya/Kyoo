using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// Metadata of episode currently watching by an user
	/// </summary>
	public class WatchedEpisode : IResource
	{
		/// <inheritdoc />
		[SerializeIgnore] public int ID
		{
			get => Episode.ID;
			set => Episode.ID = value;
		}

		/// <inheritdoc />
		[SerializeIgnore] public string Slug => Episode.Slug;
		
		/// <summary>
		/// The episode currently watched
		/// </summary>
		public Episode Episode { get; set; }
		
		/// <summary>
		/// Where the player has stopped watching the episode (-1 if not started, else between 0 and 100).
		/// </summary>
		public int WatchedPercentage { get; set; }
	}
}