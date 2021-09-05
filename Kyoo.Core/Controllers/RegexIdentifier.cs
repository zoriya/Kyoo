using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Core.Models.Options;
using Kyoo.Core.Models.Watch;
using Kyoo.Utils;
using Microsoft.Extensions.Options;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// An identifier that use a regex to extract basics metadata.
	/// </summary>
	public class RegexIdentifier : IIdentifier
	{
		/// <summary>
		/// The configuration of kyoo to retrieve the identifier regex.
		/// </summary>
		private readonly IOptionsMonitor<MediaOptions> _configuration;

		/// <summary>
		/// The library manager used to retrieve libraries paths.
		/// </summary>
		private readonly ILibraryManager _libraryManager;

		/// <summary>
		/// Create a new <see cref="RegexIdentifier"/>.
		/// </summary>
		/// <param name="configuration">The regex patterns to use.</param>
		/// <param name="libraryManager">The library manager used to retrieve libraries paths.</param>
		public RegexIdentifier(IOptionsMonitor<MediaOptions> configuration, ILibraryManager libraryManager)
		{
			_configuration = configuration;
			_libraryManager = libraryManager;
		}

		/// <summary>
		/// Retrieve the relative path of an episode or subtitle.
		/// </summary>
		/// <param name="path">The full path of the episode</param>
		/// <returns>The path relative to the library root.</returns>
		private async Task<string> _GetRelativePath(string path)
		{
			string libraryPath = (await _libraryManager.GetAll<Library>())
				.SelectMany(x => x.Paths)
				.Where(path.StartsWith)
				.OrderByDescending(x => x.Length)
				.FirstOrDefault();
			return path[(libraryPath?.Length ?? 0)..];
		}

		/// <inheritdoc />
		public async Task<(Collection, Show, Season, Episode)> Identify(string path)
		{
			string relativePath = await _GetRelativePath(path);
			Match match = _configuration.CurrentValue.Regex
				.Select(x => new Regex(x, RegexOptions.IgnoreCase | RegexOptions.Compiled))
				.Select(x => x.Match(relativePath))
				.FirstOrDefault(x => x.Success);

			if (match == null)
				throw new IdentificationFailedException($"The episode at {path} does not match the episode's regex.");

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

			return ret;
		}

		/// <inheritdoc />
		public Task<Track> IdentifyTrack(string path)
		{
			Match match = _configuration.CurrentValue.SubtitleRegex
				.Select(x => new Regex(x, RegexOptions.IgnoreCase | RegexOptions.Compiled))
				.Select(x => x.Match(path))
				.FirstOrDefault(x => x.Success);

			if (match == null)
				throw new IdentificationFailedException($"The subtitle at {path} does not match the subtitle's regex.");

			string episodePath = match.Groups["Episode"].Value;
			string extension = Path.GetExtension(path);
			return Task.FromResult(new Track
			{
				Type = StreamType.Subtitle,
				Language = match.Groups["Language"].Value,
				IsDefault = match.Groups["Default"].Success,
				IsForced = match.Groups["Forced"].Success,
				Codec = FileExtensions.SubtitleExtensions.GetValueOrDefault(extension, extension[1..]),
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