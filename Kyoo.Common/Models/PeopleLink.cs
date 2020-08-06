using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class PeopleLink : IResource
	{
		[JsonIgnore] public int ID { get; set; }
		[JsonIgnore] public int PeopleID { get; set; }
		[JsonIgnore] public virtual People People { get; set; }
		
		public string Slug
		{
			get => People.Slug;
			set => People.Slug = value;
		}
		
		public string Name
		{
			get => People.Name;
			set => People.Name = value;
		}
		
		public string Poster
		{
			get => People.Poster;
			set => People.Poster = value;
		}
		
		public IEnumerable<MetadataID> ExternalIDs
		{
			get => People.ExternalIDs;
			set => People.ExternalIDs = value;
		}

		[JsonIgnore] public int ShowID { get; set; }
		[JsonIgnore] public virtual Show Show { get; set; }
		public string Role { get; set; }
		public string Type { get; set; }

		public PeopleLink() {}
		
		public PeopleLink(People people, Show show, string role, string type)
		{
			People = people;
			Show = show;
			Role = role;
			Type = type;
		}

		public PeopleLink(string slug, 
			string name, 
			string role, 
			string type,
			string poster,
			IEnumerable<MetadataID> externalIDs)
		{
			People = new People(slug, name, poster, externalIDs);
			Role = role;
			Type = type;
		}
	}

	public class ShowRole : IResource
	{
		public int ID { get; set; }
		public string Role { get; set; }
		public string Type { get; set; }

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
		public bool IsMovie { get; set; }
		
		public ShowRole() {}

		public ShowRole(PeopleLink x)
		{
			ID = x.ID;
			Role = x.Role;
			Type = x.Type;
			Slug = x.Show.Slug;
			Title = x.Show.Title;
			Aliases = x.Show.Aliases;
			Path = x.Show.Path;
			Overview = x.Show.Overview;
			Status = x.Show.Status;
			TrailerUrl = x.Show.TrailerUrl;
			StartYear = x.Show.StartYear;
			EndYear = x.Show.EndYear;
			Poster = x.Show.Poster;
			Logo = x.Show.Logo;
			Backdrop = x.Show.Backdrop;
			IsMovie = x.Show.IsMovie;
		}

		public static Expression<Func<PeopleLink, ShowRole>> FromPeopleRole => x => new ShowRole
		{
			ID = x.ID,
			Role = x.Role,
			Type = x.Type,
			Slug = x.Show.Slug,
			Title = x.Show.Title,
			Aliases = x.Show.Aliases,
			Path = x.Show.Path,
			Overview = x.Show.Overview,
			Status = x.Show.Status,
			TrailerUrl = x.Show.TrailerUrl,
			StartYear = x.Show.StartYear,
			EndYear = x.Show.EndYear,
			Poster = x.Show.Poster,
			Logo = x.Show.Logo,
			Backdrop = x.Show.Backdrop,
			IsMovie = x.Show.IsMovie
		};
	}
}