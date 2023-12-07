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

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Api
{
	/// <summary>
	/// The custom options of newtonsoft json. This simply add the <see cref="PeopleRoleConverter"/> and set
	/// the <see cref="JsonSerializerContract"/>. It is on a separate class to use dependency injection.
	/// </summary>
	public class JsonOptions : IConfigureOptions<MvcNewtonsoftJsonOptions>
	{
		/// <summary>
		/// The http context accessor given to the <see cref="JsonSerializerContract"/>.
		/// </summary>
		private readonly IHttpContextAccessor _httpContextAccessor;

		/// <summary>
		/// Create a new <see cref="JsonOptions"/>.
		/// </summary>
		/// <param name="httpContextAccessor">
		/// The http context accessor given to the <see cref="JsonSerializerContract"/>.
		/// </param>
		public JsonOptions(IHttpContextAccessor httpContextAccessor)
		{
			_httpContextAccessor = httpContextAccessor;
		}

		/// <inheritdoc />
		public void Configure(MvcNewtonsoftJsonOptions options)
		{
			options.SerializerSettings.ContractResolver = new JsonSerializerContract(
				_httpContextAccessor
			);
			options.SerializerSettings.Converters.Add(new PeopleRoleConverter());
		}
	}
}
