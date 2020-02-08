using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Studio
    {
        [JsonIgnore] public long ID { get; set; }
        public string Slug { get; set; }
        public string Name { get; set; }

        public Studio() { }

        public Studio(string slug, string name)
        {
            Slug = slug;
            Name = name;
        }
        
        public static Studio Default()
        {
            return new Studio("unknow", "Unknow Studio");
        }
    }
}
