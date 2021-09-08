// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using JetBrains.Annotations;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// The list of available stream types.
	/// Attachments are only used temporarily by the transcoder but are not stored in a database.
	/// </summary>
	public enum StreamType
	{
		/// <summary>
		/// The type of the stream is not known.
		/// </summary>
		Unknown = 0,

		/// <summary>
		/// The stream is a video.
		/// </summary>
		Video = 1,

		/// <summary>
		/// The stream is an audio.
		/// </summary>
		Audio = 2,

		/// <summary>
		/// The stream is a subtitle.
		/// </summary>
		Subtitle = 3,

		/// <summary>
		/// The stream is an attachement (a font, an image or something else).
		/// Only fonts are handled by kyoo but they are not saved to the database.
		/// </summary>
		Attachment = 4
	}

	/// <summary>
	/// A video, audio or subtitle track for an episode.
	/// </summary>
	public class Track : IResource
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		[Computed] public string Slug
		{
			get
			{
				string type = Type.ToString().ToLower();
				string index = TrackIndex != 0 ? $"-{TrackIndex}" : string.Empty;
				string episode = EpisodeSlug ?? Episode?.Slug ?? EpisodeID.ToString();
				return $"{episode}.{Language ?? "und"}{index}{(IsForced ? ".forced" : string.Empty)}.{type}";
			}

			[UsedImplicitly] private set
			{
				if (value == null)
					throw new ArgumentNullException(nameof(value));
				Match match = Regex.Match(value,
					@"(?<ep>[^\.]+)\.(?<lang>\w{0,3})(-(?<index>\d+))?(\.(?<forced>forced))?\.(?<type>\w+)(\.\w*)?");

				if (!match.Success)
				{
					throw new ArgumentException("Invalid track slug. " +
					                            "Format: {episodeSlug}.{language}[-{index}][.forced].{type}[.{extension}]");
				}

				EpisodeSlug = match.Groups["ep"].Value;
				Language = match.Groups["lang"].Value;
				if (Language == "und")
					Language = null;
				TrackIndex = match.Groups["index"].Success ? int.Parse(match.Groups["index"].Value) : 0;
				IsForced = match.Groups["forced"].Success;
				Type = Enum.Parse<StreamType>(match.Groups["type"].Value, true);
			}
		}

		/// <summary>
		/// The slug of the episode that contain this track. If this is not set, this track is ill-formed.
		/// </summary>
		[SerializeIgnore] public string EpisodeSlug { private get; set; }

		/// <summary>
		/// The title of the stream.
		/// </summary>
		public string Title { get; set; }

		/// <summary>
		/// The language of this stream (as a ISO-639-2 language code)
		/// </summary>
		public string Language { get; set; }

		/// <summary>
		/// The codec of this stream.
		/// </summary>
		public string Codec { get; set; }

		/// <summary>
		/// Is this stream the default one of it's type?
		/// </summary>
		public bool IsDefault { get; set; }

		/// <summary>
		/// Is this stream tagged as forced?
		/// </summary>
		public bool IsForced { get; set; }

		/// <summary>
		/// Is this track extern to the episode's file?
		/// </summary>
		public bool IsExternal { get; set; }

		/// <summary>
		/// The path of this track.
		/// </summary>
		[SerializeIgnore] public string Path { get; set; }

		/// <summary>
		/// The type of this stream.
		/// </summary>
		[SerializeIgnore] public StreamType Type { get; set; }

		/// <summary>
		/// The ID of the episode that uses this track.
		/// </summary>
		[SerializeIgnore] public int EpisodeID { get; set; }

		/// <summary>
		/// The episode that uses this track.
		/// </summary>
		[LoadableRelation(nameof(EpisodeID))] public Episode Episode { get; set; }

		/// <summary>
		/// The index of this track on the episode.
		/// </summary>
		public int TrackIndex { get; set; }

		/// <summary>
		/// A user-friendly name for this track. It does not include the track type.
		/// </summary>
		public string DisplayName
		{
			get
			{
				string language = _GetLanguage(Language);

				if (language == null)
					return $"Unknown (index: {TrackIndex})";
				CultureInfo info = CultureInfo.GetCultures(CultureTypes.NeutralCultures)
					.FirstOrDefault(x => x.ThreeLetterISOLanguageName == language);
				string name = info?.EnglishName ?? language;
				if (IsForced)
					name += " Forced";
				if (IsExternal)
					name += " (External)";
				if (Title is { Length: > 1 })
					name += " - " + Title;
				return name;
			}
		}

		// Converting mkv track language to c# system language tag.
		private static string _GetLanguage(string mkvLanguage)
		{
			// TODO delete this and have a real way to get the language string from the ISO-639-2.
			return mkvLanguage switch
			{
				"fre" => "fra",
				null => "und",
				_ => mkvLanguage
			};
		}

		/// <summary>
		/// Utility method to create a track slug from a incomplete slug (only add the type of the track).
		/// </summary>
		/// <param name="baseSlug">The slug to edit</param>
		/// <param name="type">The new type of this </param>
		/// <returns>The completed slug.</returns>
		public static string BuildSlug(string baseSlug, StreamType type)
		{
			return baseSlug.EndsWith($".{type}", StringComparison.InvariantCultureIgnoreCase)
				? baseSlug
				: $"{baseSlug}.{type.ToString().ToLowerInvariant()}";
		}
	}
}
