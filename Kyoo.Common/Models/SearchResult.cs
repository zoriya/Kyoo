using System.Collections.Generic;

namespace Kyoo.Models
{
    public class SearchResult
    {
        public string Query;
        public IEnumerable<Show> Shows;
        public IEnumerable<Episode> Episodes;
        public IEnumerable<People> People;
        public IEnumerable<Genre> Genres;
        public IEnumerable<Studio> Studios;
    }
}
