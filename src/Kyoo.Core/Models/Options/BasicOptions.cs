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

namespace Kyoo.Core.Models.Options
{
	/// <summary>
	/// The typed list of basic/global options for Kyoo
	/// </summary>
	public class BasicOptions
	{
		/// <summary>
		/// The path of this list of options
		/// </summary>
		public const string Path = "Basics";

		/// <summary>
		/// The internal url where the server will listen. It supports globing.
		/// </summary>
		public string Url { get; set; } = "http://*:5000";

		/// <summary>
		/// The public url that will be used in items response and in authentication server host.
		/// </summary>
		public Uri PublicUrl { get; set; } = new("http://localhost:5000");

		/// <summary>
		/// The path of the plugin directory.
		/// </summary>
		public string PluginPath { get; set; } = "plugins/";

		/// <summary>
		/// The temporary folder to cache transmuxed file.
		/// </summary>
		public string TransmuxPath { get; set; } = "cached/transmux";

		/// <summary>
		/// The temporary folder to cache transcoded file.
		/// </summary>
		public string TranscodePath { get; set; } = "cached/transcode";

		/// <summary>
		/// The path where metadata is stored.
		/// </summary>
		public string MetadataPath { get; set; } = "metadata/";
	}
}
