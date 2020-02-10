using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class PeopleLink
    {
	    [JsonIgnore] public long ID { get; set; }
	    [JsonIgnore] public long PeopleID { get; set; }
        [JsonIgnore] public virtual People People { get; set; }
        
        public string Slug => People.Slug;
        public string Name => People.Name;
        public string ExternalIDs => People.ExternalIDs;

        [JsonIgnore] public long ShowID { get; set; }
        [JsonIgnore] public virtual Show Show { get; set; }
        public string Role { get; set; }
        public string Type { get; set; }

        public PeopleLink() {}
        
        public PeopleLink(People people, string role, string type)
        {
	        People = people;
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