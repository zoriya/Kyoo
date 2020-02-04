using System.Collections.Generic;
using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Library
    {
        [JsonIgnore] public long Id { get; set; }
        public string Slug { get; set; }
        public string Name { get; set; }
        public string[] Paths { get; set; }
        public string[] Providers { get; set; }

        public Library()  { }
        
        public Library(long id, string slug, string name, string[] paths, string[] providers)
        {
            Id = id;
            Slug = slug;
            Name = name;
            Paths = paths;
            Providers = providers;
        }

        public static Library FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Library((long)reader["id"],
                reader["slug"] as string,
                reader["name"] as string,
                (reader["path"] as string)?.Split('|'),
                (reader["providers"] as string)?.Split('|'));
        }
    }
}
