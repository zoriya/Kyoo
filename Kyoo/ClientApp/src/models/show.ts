interface Show
{
  id: number;
  Slug: string;
  title: string;
  //IEnumerable < > Aliases;
  Path: string;
  Overview: string;
  //IEnumerable < > Genres;
  //Status ? Status;

  StartYear: number;
  EndYear : number;

  ImgPrimary: string;
  ImgThumb: string;
  ImgLogo: string;
  ImgBackdrop: string;

  ExternalIDs: string;
}
