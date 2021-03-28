using System.Data.Common;
using Microsoft.Extensions.Configuration;

namespace Kyoo
{
	/// <summary>
	/// A class that regroup extensions used by some asp-net related parts of the app.
	/// </summary>
	public static class Extensions
	{
		/// <summary>
		/// Get a connection string from the Configuration's section "Databse"
		/// </summary>
		/// <param name="config">The IConfiguration instance to load.</param>
		/// <returns>A parsed connection string</returns>
		public static string GetDatabaseConnection(this IConfiguration config)
		{
			DbConnectionStringBuilder builder = new();
			IConfigurationSection section = config.GetSection("Database");
			foreach (IConfigurationSection child in section.GetChildren())
				builder[child.Key] = child.Value;
			return builder.ConnectionString;
		}
	}
}