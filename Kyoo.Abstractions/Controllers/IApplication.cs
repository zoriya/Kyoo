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
		/// Get the data directory
		/// </summary>
		/// <returns>Retrieve the data directory where runtime data should be stored</returns>
		string GetDataDirectory();

		/// <summary>
		/// Retrieve the path of the json configuration file
		/// (relative to the data directory, see <see cref="GetDataDirectory"/>).
		/// </summary>
		/// <returns>The configuration file name.</returns>
		string GetConfigFile();
	}
}