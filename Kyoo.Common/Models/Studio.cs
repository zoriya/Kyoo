using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class Studio
    {
        [JsonIgnore] public readonly long id;
        public string Slug;
        public string Name;

        public Studio(string slug, string name)
        {
            Slug = slug;
            Name = name;
        }

        public Studio(long id, string slug, string name)
        {
            this.id = id;
            Slug = slug;
            Name = name;
        }

        public static Studio FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Studio((long)reader["id"],
                reader["slug"] as string,
                reader["name"] as string);
        }

        public static Studio Default()
        {
            return new Studio("unknow", "Unknow Studio");
        }
    }
}
