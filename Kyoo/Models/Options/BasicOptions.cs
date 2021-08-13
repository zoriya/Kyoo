using System;

namespace Kyoo.Models.Options
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
		/// <c>true</c> if the metadata of a show/season/episode should be stored in the same directory as video files,
		/// <c>false</c> to save them in a kyoo specific directory.
		/// </summary>
		/// <remarks>
		/// Some file systems might discard this option to store them somewhere else.
		/// For example, readonly file systems will probably store them in a kyoo specific directory.
		/// </remarks>
		public bool MetadataInShow { get; set; } = true;

		/// <summary>
		/// The path for metadata if they are not stored near show (see <see cref="MetadataInShow"/>).
		/// Some resources can't be stored near a show and they are stored in this directory
		/// (like <see cref="Provider"/>).
		/// </summary>
		public string MetadataPath { get; set; } = "metadata/";
	}
}