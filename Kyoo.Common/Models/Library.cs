using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Library
    {
        [JsonIgnore] public long ID { get; set; }
        public string Slug { get; set; }
        public string Name { get; set; }
        public string[] Paths { get; set; }
        public string[] Providers { get; set; }

        public Library()  { }
        
        public Library(string slug, string name, string[] paths, string[] providers)
        {
            Slug = slug;
            Name = name;
            Paths = paths;
            Providers = providers;
        }
    }
}
