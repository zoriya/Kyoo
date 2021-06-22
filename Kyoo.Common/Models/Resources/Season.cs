using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using JetBrains.Annotations;
using Kyoo.Controllers;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	/// <summary>
	/// A season of a <see cref="Show"/>. 
	/// </summary>
	public class Season : IResource
	{
		/// <inheritdoc />
		public int ID  { get; set; }

		/// <inheritdoc />
		[Computed] public string Slug
		{
			get
			{
				if (ShowSlug == null && Show == null)
					return $"{ShowID}-s{SeasonNumber}";
				return $"{ShowSlug ?? Show?.Slug}-s{SeasonNumber}";
			}
			[UsedImplicitly] private set
			{
				Match match = Regex.Match(value ?? "", @"(?<show>.+)-s(?<season>\d+)");
			
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
		/// The ID of the Show containing this season. This value is only set when the <see cref="Show"/> has been loaded.
		/// </summary>
		[SerializeIgnore] public int ShowID { get; set; }
		/// <summary>
		/// The show that contains this season. This must be explicitly loaded via a call to <see cref="ILibraryManager.Load"/>.
		/// </summary>
		[LoadableRelation(nameof(ShowID))] public Show Show { get; set; }

		/// <summary>
		/// The number of this season. This can be set to 0 to indicate specials. This defaults to -1 for unset.
		/// </summary>
		public int SeasonNumber { get; set; } = -1;

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

		/// <summary>
		/// The path of this poster.
		/// By default, the http path for this poster is returned from the public API.
		/// This can be disabled using the internal query flag.
		/// </summary>
		[SerializeAs("{HOST}/api/seasons/{Slug}/thumb")] public string Poster { get; set; }
		
		/// <summary>
		/// The link to metadata providers that this episode has. See <see cref="MetadataID{T}"/> for more information.
		/// </summary>
		[EditableRelation] [LoadableRelation] public ICollection<MetadataID<Season>> ExternalIDs { get; set; }

		/// <summary>
		/// The list of episodes that this season contains.
		/// </summary>
		[LoadableRelation] public ICollection<Episode> Episodes { get; set; }
	}
}
