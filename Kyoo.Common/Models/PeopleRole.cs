using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class PeopleRole : IResource
	{
		[SerializeIgnore] public int ID { get; set; }
		[SerializeIgnore] public string Slug => ForPeople ? Show.Slug : People.Slug;
		[SerializeIgnore] public bool ForPeople;
		[SerializeIgnore] public int PeopleID { get; set; }
		// TODO implement a SerializeInline for People or Show depending on the context.
		[SerializeIgnore] public virtual People People { get; set; }
		[SerializeIgnore] public int ShowID { get; set; }
		[SerializeIgnore] public virtual Show Show { get; set; }
		public string Role { get; set; }
		public string Type { get; set; }

		public PeopleRole() {}
		
		public PeopleRole(People people, Show show, string role, string type)
		{
			People = people;
			Show = show;
			Role = role;
			Type = type;
		}

		public PeopleRole(string slug, 
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
}