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

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A role a person played for a show. It can be an actor, musician, voice actor, director, writer...
	/// </summary>
	/// <remarks>
	/// This class is not serialized like other classes.
	/// Based on the <see cref="ForPeople"/> field, it is serialized like
	/// a show with two extra fields (<see cref="Role"/> and <see cref="Type"/>).
	/// </remarks>
	public class PeopleRole : IResource
	{
		/// <inheritdoc />
		public int Id { get; set; }

		/// <inheritdoc />
		public string Slug => ForPeople ? Show.Slug : People.Slug;

		/// <summary>
		/// Should this role be used as a Show substitute (the value is <c>true</c>) or
		/// as a People substitute (the value is <c>false</c>).
		/// </summary>
		public bool ForPeople { get; set; }

		/// <summary>
		/// The ID of the People playing the role.
		/// </summary>
		public int PeopleID { get; set; }

		/// <summary>
		/// The people that played this role.
		/// </summary>
		public People People { get; set; }

		/// <summary>
		/// The ID of the Show where the People playing in.
		/// </summary>
		public int? ShowID { get; set; }

		/// <summary>
		/// The show where the People played in.
		/// </summary>
		public Show? Show { get; set; }

		public int? MovieID { get; set; }

		public Movie? Movie { get; set; }

		/// <summary>
		/// The type of work the person has done for the show.
		/// That can be something like "Actor", "Writer", "Music", "Voice Actor"...
		/// </summary>
		public string Type { get; set; }

		/// <summary>
		/// The role the People played.
		/// This is mostly used to inform witch character was played for actor and voice actors.
		/// </summary>
		public string Role { get; set; }
	}
}
