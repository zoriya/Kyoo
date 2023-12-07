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
using Kyoo.Abstractions.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// A custom role's convertor to inline the person or the show depending on the value of
	/// <see cref="PeopleRole.ForPeople"/>.
	/// </summary>
	public class PeopleRoleConverter : JsonConverter<PeopleRole>
	{
		/// <inheritdoc />
		public override void WriteJson(
			JsonWriter writer,
			PeopleRole? value,
			JsonSerializer serializer
		)
		{
			// if (value == null)
			// {
			// 	writer.WriteNull();
			// 	return;
			// }
			//
			// ICollection<PeopleRole>? oldPeople = value.Show?.People;
			// ICollection<PeopleRole>? oldRoles = value.People?.Roles;
			// if (value.Show != null)
			// 	value.Show.People = null;
			// if (value.People != null)
			// 	value.People.Roles = null;
			//
			// JObject obj = JObject.FromObject((value.ForPeople ? value.People : value.Show)!, serializer);
			// obj.Add("role", value.Role);
			// obj.Add("type", value.Type);
			// obj.WriteTo(writer);
			//
			// if (value.Show != null)
			// 	value.Show.People = oldPeople;
			// if (value.People != null)
			// 	value.People.Roles = oldRoles;
		}

		/// <inheritdoc />
		public override PeopleRole ReadJson(
			JsonReader reader,
			Type objectType,
			PeopleRole? existingValue,
			bool hasExistingValue,
			JsonSerializer serializer
		)
		{
			throw new NotImplementedException();
		}
	}
}
