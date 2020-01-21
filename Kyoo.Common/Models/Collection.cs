using Kyoo.Controllers;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Models
{
    public class Collection : IMergable<Collection>

    {
    [JsonIgnore] public long id = -1;
    public string Slug;
    public string Name;
    public string Poster;
    public string Overview;
    [JsonIgnore] public string ImgPrimary;
    public IEnumerable<Show> Shows;

    public Collection()
    {
    }

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
        Collection col = new Collection((long) reader["id"],
            reader["slug"] as string,
            reader["name"] as string,
            reader["overview"] as string,
            reader["imgPrimary"] as string);
        col.Poster = "poster/" + col.Slug;
        return col;
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

    public Collection Merge(Collection collection)
    {
        if (id == -1)
            id = collection.id;
        if (Slug == null)
            Slug = collection.Slug;
        if (Name == null)
            Name = collection.Name;
        if (Poster == null)
            Poster = collection.Poster;
        if (Overview == null)
            Overview = collection.Overview;
        if (ImgPrimary == null)
            ImgPrimary = collection.ImgPrimary;
        if (Shows == null)
            Shows = collection.Shows;
        else
            Shows = Shows.Concat(collection.Shows);
        return this;
    }
    }
}
