using System;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Options;
using Kyoo.Models.Watch;
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
		/// Create a new <see cref="RegexIdentifier"/>.
		/// </summary>
		/// <param name="configuration">The regex patterns to use.</param>
		public RegexIdentifier(IOptions<MediaOptions> configuration)
		{
			_configuration = configuration;
		}
		
		/// <inheritdoc />
		public Task<(Collection, Show, Season, Episode)> Identify(string path)
		{
			Regex regex = new(_configuration.Value.Regex, RegexOptions.IgnoreCase | RegexOptions.Compiled);
			Match match = regex.Match(path);

			if (!match.Success)
				throw new IdentificationFailed($"The episode at {path} does not match the episode's regex.");

			(Collection collection, Show show, Season season, Episode episode) ret = new();
			
			ret.collection.Name = match.Groups["Collection"].Value;
			ret.collection.Slug = Utility.ToSlug(ret.collection.Name);
			
			ret.show.Title = match.Groups["Show"].Value;
			ret.show.Slug = Utility.ToSlug(ret.show.Title);
			ret.show.Path = Path.GetDirectoryName(path);
			ret.episode.Path = path;

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

			if (ret.episode.SeasonNumber == null && ret.episode.EpisodeNumber == null
				&& ret.episode.AbsoluteNumber == null)
			{
				ret.show.IsMovie = true;
				ret.episode.Title = ret.show.Title;
			}

			return Task.FromResult(ret);
		}

		/// <inheritdoc />
		public Task<Track> IdentifyTrack(string path)
		{
			Regex regex = new(_configuration.Value.SubtitleRegex, RegexOptions.IgnoreCase | RegexOptions.Compiled);
			Match match = regex.Match(path);

			if (!match.Success)
				throw new IdentificationFailed($"The subtitle at {path} does not match the subtitle's regex.");

			string episodePath = match.Groups["Episode"].Value;
			return Task.FromResult(new Track
			{
				Type = StreamType.Subtitle,
				Language = match.Groups["Language"].Value,
				IsDefault = match.Groups["Default"].Value.Length > 0, 
				IsForced = match.Groups["Forced"].Value.Length > 0,
				Codec = FileExtensions.SubtitleExtensions[Path.GetExtension(path)],
				IsExternal = true,
				Path = path,
				Episode = new Episode
				{
					Path = episodePath
				}
			});
		}
	}
}