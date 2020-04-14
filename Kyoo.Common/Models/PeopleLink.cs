using Newtonsoft.Json;

namespace Kyoo.Models
{
	public class PeopleLink
	{
		[JsonIgnore] public long ID { get; set; }
		[JsonIgnore] public string PeopleID { get; set; }
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
		
		public string ExternalIDs
		{
			get => People.ExternalIDs;
			set => People.ExternalIDs = value;
		}

		[JsonIgnore] public long ShowID { get; set; }
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

		public PeopleLink(string slug, string name, string role, string type, string imgPrimary, string externalIDs)
		{
			People = new People(slug, name, imgPrimary, externalIDs);
			Role = role;
			Type = type;
		}
	}
}