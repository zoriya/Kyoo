using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Library
    {
        [JsonIgnore] public readonly long id;
        public string Slug;
        public string Name;
        public string[] Paths;
        public string[] Providers;

        public Library(long id, string slug, string name, string[] paths, string[] providers)
        {
            this.id = id;
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
