using Kyoo.InternalAPI;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace Kyoo.Models
{
    public class Collection
    {
        [JsonIgnore] public long id;
        public string Slug;
        public string Name;
        public string Overview;
        [JsonIgnore] public string ImgPrimary;
        public IEnumerable<Show> Shows;

        public Collection() { }

        public Collection(long id, string slug, string name, string overview, string imgPrimary)
        {
            this.id = id;
            Slug = slug;
            Name = name;
            Overview = overview;
            ImgPrimary = imgPrimary;
        }

        public static Collection FromReader(System.Data.SQLite.SQLiteDataReader reader)
        {
            return new Collection((long)reader["id"],
                reader["slug"] as string,
                reader["name"] as string,
                reader["overview"] as string,
                reader["imgPrimary"] as string);
        }

        public Show AsShow()
        {
            return new Show(-1, Slug, Name, null, null, Overview, null, null, null, null, null, null);
        }

        public Collection SetShows(ILibraryManager libraryManager)
        {
            Shows = libraryManager.GetShowsInCollection(id);
            return this;
        }
    }
}
