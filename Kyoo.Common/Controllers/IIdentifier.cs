using System.Threading.Tasks;
using Kyoo.Models;

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
		/// <returns>
		/// A tuple of models representing parsed metadata.
		/// If no metadata could be parsed for a type, null can be returned.
		/// </returns>
		Task<(Collection, Show, Season, Episode)> Identify(string path);
	}
}