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
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;
using Kyoo.Utils;
using Newtonsoft.Json;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A single user of the app.
	/// </summary>
	public class User : IQuery, IResource, IAddedDate
	{
		public static Sort DefaultSort => new Sort<User>.By(x => x.Username);

		/// <inheritdoc />
		public Guid Id { get; set; }

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
		/// User settings
		/// </summary>
		public Dictionary<string, string> Settings { get; set; } = new();

		/// <summary>
		/// User accounts on other services.
		/// </summary>
		public Dictionary<string, ExternalToken> ExternalId { get; set; } = new();

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

	public class ExternalToken
	{
		/// <summary>
		/// The id of this user on the external service.
		/// </summary>
		public string Id { get; set; }

		/// <summary>
		/// A jwt token used to interact with the service.
		/// Do not forget to refresh it when using it if necessary.
		/// </summary>
		public JwtToken Token { get; set; }

		/// <summary>
		/// The link to the user profile on this website. Null if it does not exist.
		/// </summary>
		public string? ProfileUrl { get; set; }
	}
}
