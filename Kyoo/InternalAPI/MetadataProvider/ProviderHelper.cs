using Kyoo.InternalAPI.Utility;
using Kyoo.Models;
using System.Collections.Generic;

namespace Kyoo.InternalAPI.MetadataProvider
{
    public abstract class ProviderHelper
    {
        public abstract string Provider { get; }

        public string GetID(string externalIDs)
        {
            if (externalIDs?.Contains(Provider) == true)
            {
                int startIndex = externalIDs.IndexOf(Provider) + Provider.Length + 1; //The + 1 is for the '='
                return externalIDs.Substring(startIndex, externalIDs.IndexOf('|', startIndex) - startIndex);
            }
            else
                return null;
        }

        public string ToSlug(string showTitle)
        {
            return Slugifier.ToSlug(showTitle);
        }

        public enum ImageType { Poster, Background, Thumbnail, Logo }

        public void SetImage(Show show, string imgUrl, ImageType type)
        {
            switch(type)
            {
                case ImageType.Poster:
                    show.ImgPrimary = imgUrl;
                    break;
                case ImageType.Thumbnail:
                    show.ImgThumb = imgUrl;
                    break;
                case ImageType.Logo:
                    show.ImgLogo = imgUrl;
                    break;
                case ImageType.Background:
                    show.ImgBackdrop = imgUrl;
                    break;
                default:
                    break;
            }
        }

        public IEnumerable<Genre> GetGenres(string[] input)
        {
            List<Genre> genres = new List<Genre>();

            foreach (string genre in input)
                genres.Add(new Genre(ToSlug(genre), genre));

            return genres;
        }
    }
}
