using Newtonsoft.Json;

namespace Kyoo.Models
{
    public class People : IMergable<People>
    {
        [JsonIgnore] public long ID = -1;
        public string Slug;
        public string Name;
        public string Role; //Dynamic data not stored as it in the database
        public string Type; //Dynamic data not stored as it in the database ---- Null for now
        [JsonIgnore] public string ImgPrimary;

        public string ExternalIDs;
        
        public People() {}

        public People(long id, string slug, string name, string imgPrimary, string externalIDs)
        {
            ID = id;
            Slug = slug;
            Name = name;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
        }

        public People(long id, string slug, string name, string role, string type, string imgPrimary, string externalIDs)
        {
            ID = id;
            Slug = slug;
            Name = name;
            Role = role;
            Type = type;
            ImgPrimary = imgPrimary;
            ExternalIDs = externalIDs;
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
