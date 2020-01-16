using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class People
    {
        [JsonIgnore] public long id;
        public string slug;
        public string Name;
        public string Role; //Dynamic data not stored as it in the database
        public string Type; //Dynamic data not stored as it in the database ---- Null for now
        [JsonIgnore] public string imgPrimary;

        public string externalIDs;

        public People(long id, string slug, string name, string imgPrimary, string externalIDs)
        {
            this.id = id;
            this.slug = slug;
            Name = name;
            this.imgPrimary = imgPrimary;
            this.externalIDs = externalIDs;
        }

        public People(long id, string slug, string name, string role, string type, string imgPrimary, string externalIDs)
        {
            this.id = id;
            this.slug = slug;
            Name = name;
            Role = role;
            Type = type;
            this.imgPrimary = imgPrimary;
            this.externalIDs = externalIDs;
        }

        public static People FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new People((long)reader["id"],
                reader["slug"] as string,
                reader["name"] as string,
                reader["imgPrimary"] as string,
                reader["externalIDs"] as string);
        }

        public static People FromFullReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new People((long)reader["id"],
                reader["slug"] as string,
                reader["name"] as string,
                reader["role"] as string,
                reader["type"] as string,
                reader["imgPrimary"] as string,
                reader["externalIDs"] as string);
        }
    }
}
