using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Genre
    {
        [JsonIgnore] public readonly long id;
        public string Slug;
        public string Name;

        public Genre(string slug, string name)
        {
            Slug = slug;
            Name = name;
        }

        public Genre(long id, string slug, string name)
        {
            this.id = id;
            Slug = slug;
            Name = name;
        }

        public static Genre FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Genre((long)reader["id"],
                reader["slug"] as string,
                reader["name"] as string);
        }
    }
}
