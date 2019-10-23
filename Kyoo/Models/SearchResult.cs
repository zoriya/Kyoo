using System.Collections.Generic;

namespace Kyoo.Models
{
    public class SearchResult
    {
        public IEnumerable<Show> shows;
        public IEnumerable<Episode> episodes;
        public IEnumerable<People> people;
        public IEnumerable<Genre> genres;
        public IEnumerable<Studio> studios;
    }
}
