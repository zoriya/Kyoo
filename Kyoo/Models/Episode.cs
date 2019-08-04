using System;

namespace Kyoo.Models
{
    public class Episode
    {
        public readonly long id;
        public readonly long ShowID;
        public readonly long SeasonID;

        public long episodeNumber;
        public string Title;
        public string Overview;
        public DateTime ReleaseDate;

        public long Runtime; //This runtime variable should be in seconds (used by the video manager so we need precisions)

        public string ImgPrimary;
        public string ExternalIDs;

        public long RuntimeInMinutes
        {
            get
            {
                return Runtime / 60;
            }
        }
    }
}
