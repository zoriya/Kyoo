using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models.Attributes;

namespace Kyoo.Abstractions.Models
{
	/// <summary>
	/// A season of a <see cref="Show"/>.
	/// </summary>
	public class Season : IResource, IMetadata, IThumbnails
	{
		/// <inheritdoc />
		public int ID { get; set; }

		/// <inheritdoc />
		[Computed] public string Slug
		{
			get
			{
				if (ShowSlug == null && Show == null)
					return $"{ShowID}-s{SeasonNumber}";
				return $"{ShowSlug ?? Show?.Slug}-s{SeasonNumber}";
			}

			[UsedImplicitly] [NotNull] private set
			{
				Match match = Regex.Match(value ?? string.Empty, @"(?<show>.+)-s(?<season>\d+)");

				if (!match.Success)
					throw new ArgumentException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
				ShowSlug = match.Groups["show"].Value;
				SeasonNumber = int.Parse(match.Groups["season"].Value);
			}
		}

		/// <summary>
		/// The slug of the Show that contain this episode. If this is not set, this season is ill-formed.
		/// </summary>
		[SerializeIgnore] public string ShowSlug { private get; set; }

		/// <summary>
		/// The ID of the Show containing this season.
		/// </summary>
		[SerializeIgnore] public int ShowID { get; set; }

		/// <summary>
		/// The show that contains this season.
		/// This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// </summary>
		[LoadableRelation(nameof(ShowID))] public Show Show { get; set; }

		/// <summary>
		/// The number of this season. This can be set to 0 to indicate specials.
		/// </summary>
		public int SeasonNumber { get; set; }

		/// <summary>
		/// The title of this season.
		/// </summary>
		public string Title { get; set; }

		/// <summary>
		/// A quick overview of this season.
		/// </summary>
		public string Overview { get; set; }

		/// <summary>
		/// The starting air date of this season.
		/// </summary>
		public DateTime? StartDate { get; set; }

		/// <summary>
		/// The ending date of this season.
		/// </summary>
		public DateTime? EndDate { get; set; }

		/// <inheritdoc />
		public Dictionary<int, string> Images { get; set; }

		/// <summary>
		/// The path of this poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/seasons/{Slug}/thumb")]
		[Obsolete("Use Images instead of this, this is only kept for the API response.")]
		public string Poster => Images?.GetValueOrDefault(Models.Images.Poster);

		/// <inheritdoc />
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID> ExternalIDs { get; set; }

		/// <summary>
		/// The list of episodes that this season contains.
		/// </summary>
		[LoadableRelation] public ICollection<Episode> Episodes { get; set; }
	}
}
