using Kyoo.Models;

namespace Kyoo.InternalAPI.Utility
{
	public static class ImageHelper
	{
		public static void SetImage(Show show, string imgUrl, ImageType type)
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
	}
}