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
	}
}