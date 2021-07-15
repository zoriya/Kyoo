using System;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Kyoo.Controllers
{
	/// <summary>
	/// An identifier that use a regex to extract basics metadata.
	/// </summary>
	public class RegexIdentifier : IIdentifier
	{
		/// <summary>
		/// The configuration of kyoo to retrieve the identifier regex.
		/// </summary>
		private readonly IOptions<MediaOptions> _configuration;
		/// <summary>
		/// A logger to print errors.
		/// </summary>
		private readonly ILogger<RegexIdentifier> _logger;

		/// <summary>
		/// Create a new <see cref="RegexIdentifier"/>.
		/// </summary>
		/// <param name="configuration">The regex patterns to use.</param>
		/// <param name="logger">The logger to use.</param>
		public RegexIdentifier(IOptions<MediaOptions> configuration, ILogger<RegexIdentifier> logger)
		{
			_configuration = configuration;
			_logger = logger;
		}


		/// <inheritdoc />
		public Task<(Collection, Show, Season, Episode)> Identify(string path)
		{
			string pattern = _configuration.Value.Regex;
			Regex regex = new(pattern, RegexOptions.IgnoreCase | RegexOptions.Compiled);
			Match match = regex.Match(path);

			if (!match.Success)
			{
				_logger.LogError("The episode at {Path} does not match the episode's regex", path);
				return Task.FromResult<(Collection, Show, Season, Episode)>(default);
			}

			(Collection collection, Show show, Season season, Episode episode) ret = new();
			
			ret.collection.Name = match.Groups["Collection"].Value;
			
			ret.show.Title = match.Groups["Show"].Value;
			ret.show.Path = Path.GetDirectoryName(path);

			if (match.Groups["StartYear"].Success && int.TryParse(match.Groups["StartYear"].Value, out int tmp))
				ret.show.StartAir = new DateTime(tmp, 1, 1);
			
			if (match.Groups["Season"].Success && int.TryParse(match.Groups["Season"].Value, out tmp))
			{
				ret.season.SeasonNumber = tmp;
				ret.episode.SeasonNumber = tmp;
			}

			if (match.Groups["Episode"].Success && int.TryParse(match.Groups["Episode"].Value, out tmp))
				ret.episode.EpisodeNumber = tmp;
			
			if (match.Groups["Absolute"].Success && int.TryParse(match.Groups["Absolute"].Value, out tmp))
				ret.episode.AbsoluteNumber = tmp;

			ret.show.IsMovie = ret.episode.SeasonNumber == null && ret.episode.EpisodeNumber == null 
			                   && ret.episode.AbsoluteNumber == null;
			
			return Task.FromResult(ret);
		}
	}
}