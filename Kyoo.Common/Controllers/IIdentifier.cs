using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;

namespace Kyoo.Controllers
{
	/// <summary>
	/// An interface to identify episodes, shows and metadata based on the episode file.
	/// </summary>
	public interface IIdentifier
	{
		/// <summary>
		/// Identify a path and return the parsed metadata.
		/// </summary>
		/// <param name="path">The path of the episode file to parse.</param>
		/// <exception cref="IdentificationFailed">The identifier could not work for the given path.</exception>
		/// <returns>
		/// A tuple of models representing parsed metadata.
		/// If no metadata could be parsed for a type, null can be returned.
		/// </returns>
		Task<(Collection, Show, Season, Episode)> Identify(string path);
		
		/// <summary>
		/// Identify an external subtitle or track file from it's path and return the parsed metadata.
		/// </summary>
		/// <param name="path">The path of the external track file to parse.</param>
		/// <exception cref="IdentificationFailed">The identifier could not work for the given path.</exception>
		/// <returns>
		/// The metadata of the track identified.
		/// </returns>
		Task<Track> IdentifyTrack(string path);
	}
}