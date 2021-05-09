using System.Collections.Generic;
using System.Linq;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class Show : IResource, IOnMerge
	{
		public int ID { get; set; }
		public string Slug { get; set; }
		public string Title { get; set; }
		[EditableRelation] public string[] Aliases { get; set; }
		[SerializeIgnore] public string Path { get; set; }
		public string Overview { get; set; }
		public Status? Status { get; set; }
		public string TrailerUrl { get; set; }

		public int? StartYear { get; set; }
		public int? EndYear { get; set; }

		[SerializeAs("{HOST}/api/shows/{Slug}/poster")] public string Poster { get; set; }
		[SerializeAs("{HOST}/api/shows/{Slug}/logo")] public string Logo { get; set; }
		[SerializeAs("{HOST}/api/shows/{Slug}/backdrop")] public string Backdrop { get; set; }

		public bool IsMovie { get; set; }

		[EditableRelation] [LoadableRelation] public virtual ICollection<MetadataID> ExternalIDs { get; set; }
		
		
		[SerializeIgnore] public int? StudioID { get; set; }
		[LoadableRelation(nameof(StudioID))] [EditableRelation] public virtual Studio Studio { get; set; }
		[LoadableRelation] [EditableRelation] public virtual ICollection<Genre> Genres { get; set; }
		[LoadableRelation] [EditableRelation] public virtual ICollection<PeopleRole> People { get; set; }
		[LoadableRelation] public virtual ICollection<Season> Seasons { get; set; }
		[LoadableRelation] public virtual ICollection<Episode> Episodes { get; set; }
		[LoadableRelation] public virtual ICollection<Library> Libraries { get; set; }
		[LoadableRelation] public virtual ICollection<Collection> Collections { get; set; }
		
#if ENABLE_INTERNAL_LINKS
		[SerializeIgnore] public virtual ICollection<Link<Library, Show>> LibraryLinks { get; set; }
		[SerializeIgnore] public virtual ICollection<Link<Collection, Show>> CollectionLinks { get; set; }
		[SerializeIgnore] public virtual ICollection<Link<Show, Genre>> GenreLinks { get; set; }
#endif

		public string GetID(string provider)
		{
			return ExternalIDs?.FirstOrDefault(x => x.Provider.Name == provider)?.DataID;
		}

		public virtual void OnMerge(object merged)
		{
			if (ExternalIDs != null)
				foreach (MetadataID id in ExternalIDs)
					id.Show = this;
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
