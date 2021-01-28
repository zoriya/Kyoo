namespace Kyoo.Models
{
	public class CollectionLink : IResourceLink<Collection, Show>
	{
		public int ParentID { get; set; }
		public virtual Collection Parent { get; set; }
		public int ChildID { get; set; }
		public virtual Show Child { get; set; }

		public CollectionLink() { }

		public CollectionLink(Collection parent, Show child)
		{
			Parent = parent;
			ParentID = parent.ID;
			Child = child;
			ChildID = child.ID;
		}
	}
}