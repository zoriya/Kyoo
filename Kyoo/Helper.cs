using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Models.Attributes;
using Newtonsoft.Json;

namespace Kyoo
{
	public static class Helper
	{
		/// <summary>
		/// Inject services into the <see cref="InjectedAttribute"/> marked properties of the given object.
		/// </summary>
		/// <param name="obj">The object to inject</param>
		/// <param name="retrieve">The function used to retrieve services. (The function is called immediately)</param>
		public static void InjectServices(object obj, [InstantHandle] Func<Type, object> retrieve)
		{
			IEnumerable<PropertyInfo> properties = obj.GetType().GetProperties()
				.Where(x => x.GetCustomAttribute<InjectedAttribute>() != null)
				.Where(x => x.CanWrite);

			foreach (PropertyInfo property in properties)
				property.SetValue(obj, retrieve(property.PropertyType));
		}

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