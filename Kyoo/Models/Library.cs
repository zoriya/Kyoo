using Newtonsoft.Json;

namespace Kyoo.Models
{
    public struct Library
    {
        [JsonIgnore] public readonly long id;
        public string Slug;
        public string Name;

        public Library(long id, string slug, string name)
        {
            this.id = id;
            Slug = slug;
            Name = name;
        }

        public static Library FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Library((long)reader["id"],
                reader["slug"] as string,
                reader["name"] as string);
        }
    }
}
