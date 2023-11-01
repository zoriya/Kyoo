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
using System.ComponentModel.DataAnnotations;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using Newtonsoft.Json;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A single user of the app.
	/// </summary>
	public class User : IResource, IAddedDate
	{
		/// <inheritdoc />
		public int Id { get; set; }

		/// <inheritdoc />
		[MaxLength(256)]
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
		[SerializeIgnore]
		public string Password { get; set; }

		/// <summary>
		/// The list of permissions of the user. The format of this is implementation dependent.
		/// </summary>
		public string[] Permissions { get; set; } = Array.Empty<string>();

		/// <inheritdoc />
		public DateTime AddedDate { get; set; }

		/// <summary>
		/// A logo is a small image representing the resource.
		/// </summary>
		public Image? Logo { get; set; }

		/// <summary>
		/// The list of shows the user has finished.
		/// </summary>
		[SerializeIgnore]
		public ICollection<Show>? Watched { get; set; }

		/// <summary>
		/// The list of episodes the user is watching (stopped in progress or the next episode of the show)
		/// </summary>
		[SerializeIgnore]
		public ICollection<WatchedEpisode>? CurrentlyWatching { get; set; }

		public User() { }

		[JsonConstructor]
		public User(string username)
		{
			if (username != null)
			{
				Slug = Utility.ToSlug(username);
				Username = username;
			}
		}
	}
}
