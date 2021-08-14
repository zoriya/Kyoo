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
		/// Get a connection string from the Configuration's section "Database"
		/// </summary>
		/// <param name="config">The IConfiguration instance to use.</param>
		/// <param name="database">The database's name.</param>
		/// <returns>A parsed connection string</returns>
		public static string GetDatabaseConnection(this IConfiguration config, string database)
		{
			DbConnectionStringBuilder builder = new();
			IConfigurationSection section = config.GetSection("database:configurations").GetSection(database);
			foreach (IConfigurationSection child in section.GetChildren())
				builder[child.Key] = child.Value;
			return builder.ConnectionString;
		}
		
		/// <summary>
		/// Get the name of the selected database.
		/// </summary>
		/// <param name="config">The IConfiguration instance to use.</param>
		/// <returns>The name of the selected database.</returns>
		public static string GetSelectedDatabase(this IConfiguration config)
		{
			return config.GetValue<string>("database:enabled");
		}
	}
}