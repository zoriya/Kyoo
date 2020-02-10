using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;

namespace Kyoo.Models
{
    public class Collection : IMergable<Collection>
    {
	    [JsonIgnore] public long ID { get; set; }
	    public string Slug { get; set; }
	    public string Name { get; set; }
	    public string Poster { get; set; }
	    public string Overview { get; set; }
	    [JsonIgnore] public string ImgPrimary { get; set; }
	    public IEnumerable<Show> Shows;

	    public Collection() { }

	    public Collection(string slug, string name, string overview, string imgPrimary)
	    {
	        Slug = slug;
	        Name = name;
	        Overview = overview;
	        ImgPrimary = imgPrimary;
	    }

	    public Show AsShow()
	    {
		    return new Show(Slug, Name, null, null, Overview, null, null, null, null, null, null)
		    {
				IsCollection = true
		    };
	    }

	    public Collection Merge(Collection collection)
	    {
	        if (collection == null)
	            return this;
	        if (ID == -1)
	            ID = collection.ID;
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
