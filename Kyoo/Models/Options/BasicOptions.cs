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
		/// The internal url where the server will listen
		/// </summary>
		public string Url { get; set; } = "http://*:5000";

		/// <summary>
		/// The public url that will be used in items response and in authentication server host.
		/// </summary>
		public string PublicUrl { get; set; } = "http://localhost:5000/";

		/// <summary>
		/// The path of the plugin directory.
		/// </summary>
		public string PluginPath { get; set; } = "plugins/";

		/// <summary>
		/// The path of the people pictures.
		/// </summary>
		public string PeoplePath { get; set; } = "people/";

		/// <summary>
		/// The path of providers icons.
		/// </summary>
		public string ProviderPath { get; set; } = "providers/";

		/// <summary>
		/// The temporary folder to cache transmuxed file.
		/// </summary>
		public string TransmuxPath { get; set; } = "cached/transmux";
		
		/// <summary>
		/// The temporary folder to cache transcoded file.
		/// </summary>
		public string TranscodePath { get; set; } = "cached/transcode";
	}
}