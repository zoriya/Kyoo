using System.Collections.Generic;
using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class People : IMergable<People>
    {
        [JsonIgnore] public long ID { get; set; }
        public string Slug { get; set; }
        public string Name { get; set; }
        public string Role;
        public string Type;
        [JsonIgnore] public string ImgPrimary { get; set; }
        public string ExternalIDs { get; set; }
        
        public virtual IEnumerable<PeopleLink> Roles { get; set; }
        
        public People() {}

        public People(string slug, string name, string imgPrimary, string externalIDs)
        {
            Slug = slug;
            Name = name;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }

        public People(string slug, string name, string role, string type, string imgPrimary, string externalIDs)
        {
            Slug = slug;
            Name = name;
            Role = role;
            Type = type;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }

        public People SetRoleType(string role, string type)
        {
	        Role = role;
	        Type = type;
	        return this;
        }

        public PeopleLink ToLink(Show show)
        {
	        return new PeopleLink
	        {
		        People = this,
			    PeopleID = ID,
			    Role = Role,
			    Type = Type,
			    Show = show,
			    ShowID = show.ID
	        };
        }

        public People Merge(People other)
        {
            if (other == null)
                return this;
            if (ID == -1)
                ID = other.ID;
            if (Slug == null)
                Slug = other.Slug;
            if (Name == null)
                Name = other.Name;
            if (Role == null)
                Role = other.Role;
            if (Type == null)
                Type = other.Type;
            if (ImgPrimary == null)
                ImgPrimary = other.ImgPrimary;
            ExternalIDs += '|' + other.ExternalIDs;
            return this;
        }
    }
}
