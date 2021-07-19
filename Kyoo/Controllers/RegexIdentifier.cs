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
		public Task<(Collection, Show, Season, Episode)> Identify(string path, string relativePath)
		{
			Regex regex = new(_configuration.Value.Regex, RegexOptions.IgnoreCase | RegexOptions.Compiled);
			Match match = regex.Match(relativePath);

			if (!match.Success)
				throw new IdentificationFailed($"The episode at {path} does not match the episode's regex.");

			(Collection collection, Show show, Season season, Episode episode) ret = (
				collection: new Collection
				{
					Slug = Utility.ToSlug(match.Groups["Collection"].Value),
					Name = match.Groups["Collection"].Value
				},
				show: new Show
				{
					Slug = Utility.ToSlug(match.Groups["Show"].Value),
					Title = match.Groups["Show"].Value,
					Path = Path.GetDirectoryName(path),
					StartAir = match.Groups["StartYear"].Success 
						? new DateTime(int.Parse(match.Groups["StartYear"].Value), 1, 1) 
						: null
				},
				season: null,
				episode: new Episode
				{
					SeasonNumber = match.Groups["Season"].Success 
						? int.Parse(match.Groups["Season"].Value) 
						: null,
					EpisodeNumber = match.Groups["Episode"].Success 
						? int.Parse(match.Groups["Episode"].Value) 
						: null,
					AbsoluteNumber = match.Groups["Absolute"].Success 
						? int.Parse(match.Groups["Absolute"].Value) 
						: null,
					Path = path
				}
			);

			if (ret.episode.SeasonNumber.HasValue)
				ret.season = new Season { SeasonNumber = ret.episode.SeasonNumber.Value };


			if (ret.episode.SeasonNumber == null && ret.episode.EpisodeNumber == null
				&& ret.episode.AbsoluteNumber == null)
			{
				ret.show.IsMovie = true;
				ret.episode.Title = ret.show.Title;
			}

			return Task.FromResult(ret);
		}

		/// <inheritdoc />
		public Task<Track> IdentifyTrack(string path, string relativePath)
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