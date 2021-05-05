using System.Collections.Generic;

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
		/// The list of shows the user has finished.
		/// </summary>
		public ICollection<Show> Watched { get; set; }
		
		/// <summary>
		/// The list of episodes the user is watching (stopped in progress or the next episode of the show)
		/// </summary>
		public ICollection<(Episode episode, int watchedPercentage)> CurrentlyWatching { get; set; }
	}
}