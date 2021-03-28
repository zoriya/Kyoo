using System.Data.Common;
using Microsoft.Extensions.Configuration;

namespace Kyoo
{
	public static class Extensions
	{
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