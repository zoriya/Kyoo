using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Kyoo.Core
{
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
