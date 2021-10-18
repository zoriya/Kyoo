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

using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Kyoo.Core
{
	/// <summary>
	/// A class containing helper methods.
	/// </summary>
	public static class Helper
	{
		/// <summary>
		/// An helper method to get json content from an http server. This is a temporary thing and will probably be
		/// replaced by a call to the function of the same name in the <c>System.Net.Http.Json</c> namespace when .net6
		/// gets released.
		/// </summary>
		/// <param name="client">The http server to use.</param>
		/// <param name="url">The url to retrieve</param>
		/// <typeparam name="T">The type of object to convert</typeparam>
		/// <returns>A T representing the json contained at the given url.</returns>
		public static async Task<T> GetFromJsonAsync<T>(this HttpClient client, string url)
		{
			HttpResponseMessage ret = await client.GetAsync(url);
			ret.EnsureSuccessStatusCode();
			string content = await ret.Content.ReadAsStringAsync();
			return JsonConvert.DeserializeObject<T>(content);
		}
	}
}
