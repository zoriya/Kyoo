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

namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// An interface that allow one to interact with the host and shutdown or restart the app.
	/// </summary>
	public interface IApplication
	{
		/// <summary>
		/// Shutdown the process and stop gracefully.
		/// </summary>
		void Shutdown();

		/// <summary>
		/// Restart Kyoo from scratch, reload plugins, configurations and restart the web server.
		/// </summary>
		void Restart();

		/// <summary>
		/// Get the data directory.
		/// </summary>
		/// <returns>Retrieve the data directory where runtime data should be stored.</returns>
		string GetDataDirectory();

		/// <summary>
		/// Retrieve the path of the json configuration file
		/// (relative to the data directory, see <see cref="GetDataDirectory"/>).
		/// </summary>
		/// <returns>The configuration file name.</returns>
		string GetConfigFile();
	}
}
