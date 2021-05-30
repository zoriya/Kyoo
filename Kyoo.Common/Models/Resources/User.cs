using System.Collections.Generic;
using Kyoo.Common.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// A single user of the app.
	/// </summary>
	public class User : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }
		
		/// <inheritdoc />
		public string Slug { get; set; }
		
		/// <summary>
		/// A username displayed to the user.
		/// </summary>
		public string Username { get; set; }
		
		/// <summary>
		/// The user email address.
		/// </summary>
		public string Email { get; set; }
		
		/// <summary>
		/// The user password (hashed, it can't be read like that). The hashing format is implementation defined.
		/// </summary>
		public string Password { get; set; }
		
		/// <summary>
		/// The list of permissions of the user. The format of this is implementation dependent.
		/// </summary>
		public string[] Permissions { get; set; }
		
		/// <summary>
		/// Arbitrary extra data that can be used by specific authentication implementations.
		/// </summary>
		public Dictionary<string, string> ExtraData { get; set; }
		
		/// <summary>
		/// The list of shows the user has finished.
		/// </summary>
		public ICollection<Show> Watched { get; set; }
		
		/// <summary>
		/// The list of episodes the user is watching (stopped in progress or the next episode of the show)
		/// </summary>
		public ICollection<WatchedEpisode> CurrentlyWatching { get; set; }
		
#if ENABLE_INTERNAL_LINKS
		/// <summary>
		/// Links between Users and Shows.
		/// </summary>
		[Link] public ICollection<Link<User, Show>> ShowLinks { get; set; }
#endif
	}
	
	/// <summary>
	/// Metadata of episode currently watching by an user
	/// </summary>
	public class WatchedEpisode : Link<User, Episode>
	{
		/// <summary>
		/// Where the player has stopped watching the episode (-1 if not started, else between 0 and 100).
		/// </summary>
		public int WatchedPercentage { get; set; }
	}
}