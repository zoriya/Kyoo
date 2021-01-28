namespace Kyoo.Models
{
	public class GenreLink : IResourceLink<Show, Genre>
	{
		public int ParentID { get; set; }
		public virtual Show Parent { get; set; }
		public int ChildID { get; set; }
		public virtual Genre Child { get; set; }

		public GenreLink() {}
		
		public GenreLink(Show parent, Genre child)
		{
			Parent = parent;
			Child = child;
		}
	}
}