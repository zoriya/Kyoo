using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Show : IResource, IOnMerge
	{
		[JsonIgnore] public int ID { get; set; }

		public string Slug { get; set; }
		public string Title { get; set; }
		public IEnumerable<string> Aliases { get; set; }
		[JsonIgnore] public string Path { get; set; }
		public string Overview { get; set; }
		public Status? Status { get; set; }
		public string TrailerUrl { get; set; }

		public int? StartYear { get; set; }
		public int? EndYear { get; set; }

		public string Poster { get; set; }
		public string Logo { get; set; }
		public string Backdrop { get; set; }

		public virtual IEnumerable<MetadataID> ExternalIDs { get; set; }

		public bool IsMovie { get; set; }
		
		
		public virtual IEnumerable<Genre> Genres
		{
			get => GenreLinks?.Select(x => x.Genre);
			set => GenreLinks = value?.Select(x => new GenreLink(this, x)).ToList();
		}
		[NotMergable] [JsonIgnore] public virtual IEnumerable<GenreLink> GenreLinks { get; set; }
		[JsonIgnore] public int? StudioID { get; set; }
		public virtual Studio Studio { get; set; }
		[JsonIgnore] public virtual IEnumerable<PeopleRole> People { get; set; }
		[JsonIgnore] public virtual IEnumerable<Season> Seasons { get; set; }
		[JsonIgnore] public virtual IEnumerable<Episode> Episodes { get; set; }
		
		[NotMergable] [JsonIgnore] public virtual IEnumerable<LibraryLink> LibraryLinks { get; set; }

		[NotMergable] [JsonIgnore] public IEnumerable<Library> Libraries
		{
			get => LibraryLinks?.Select(x => x.Library);
			set => LibraryLinks = value?.Select(x => new LibraryLink(x, this));
		}
		
		[NotMergable] [JsonIgnore] public virtual IEnumerable<CollectionLink> CollectionLinks { get; set; }
		
		[NotMergable] [JsonIgnore] public IEnumerable<Collection> Collections
		{
			get => CollectionLinks?.Select(x => x.Collection);
			set => CollectionLinks = value?.Select(x => new CollectionLink(x, this));
		}

		public Show() { }

		public Show(string slug, 
			string title,
			IEnumerable<string> aliases,
			string path, string overview,
			string trailerUrl,
			IEnumerable<Genre> genres,
			Status? status,
			int? startYear,
			int? endYear,
			IEnumerable<MetadataID> externalIDs)
		{
			Slug = slug;
			Title = title;
			Aliases = aliases;
			Path = path;
			Overview = overview;
			TrailerUrl = trailerUrl;
			Genres = genres;
			Status = status;
			StartYear = startYear;
			EndYear = endYear;
			ExternalIDs = externalIDs;
		}

		public Show(string slug,
			string title, 
			IEnumerable<string> aliases, 
			string path,
			string overview, 
			string trailerUrl,
			Status? status, 
			int? startYear,
			int? endYear,
			string poster,
			string logo, 
			string backdrop,
			IEnumerable<MetadataID> externalIDs)
		{
			Slug = slug;
			Title = title;
			Aliases = aliases;
			Path = path;
			Overview = overview;
			TrailerUrl = trailerUrl;
			Status = status;
			StartYear = startYear;
			EndYear = endYear;
			Poster = poster;
			Logo = logo;
			Backdrop = backdrop;
			ExternalIDs = externalIDs;
		}

		public string GetID(string provider)
		{
			return ExternalIDs?.FirstOrDefault(x => x.Provider.Name == provider)?.DataID;
		}

		public void OnMerge(object merged)
		{
			if (ExternalIDs != null)
				foreach (MetadataID id in ExternalIDs)
					id.Show = this;
			if (GenreLinks != null)
				foreach (GenreLink genre in GenreLinks)
					genre.Show = this;
			if (People != null)
				foreach (PeopleRole link in People)
					link.Show = this;
			if (Seasons != null)
				foreach (Season season in Seasons)
					season.Show = this;
			if (Episodes != null)
				foreach (Episode episode in Episodes)
					episode.Show = this;
		}
	}

	public enum Status { Finished, Airing, Planned, Unknown }
}
