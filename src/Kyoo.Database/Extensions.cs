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

using System.Data.Common;
using Microsoft.Extensions.Configuration;

namespace Kyoo.Database
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
